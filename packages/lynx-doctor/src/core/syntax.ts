import ts from "typescript";

export type RuntimeFunction = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction |
  ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.ConstructorDeclaration;

export const isRuntimeFunction = (node: ts.Node): node is RuntimeFunction =>
  ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) ||
  ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) ||
  ts.isConstructorDeclaration(node);

export const unwrap = (node: ts.Node): ts.Node => {
  while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
    node = node.expression;
  }
  return node;
};

export const hasDirective = (fn: RuntimeFunction, directive: string): boolean => {
  const first = fn.body && ts.isBlock(fn.body) ? fn.body.statements[0] : undefined;
  return !!first && ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) && first.expression.text === directive;
};

export const propertyName = (node: ts.Node): string | undefined => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    return node.argumentExpression.text;
  }
  return undefined;
};

export interface SyntaxFinding {
  readonly ruleId: string;
  readonly node: ts.Node;
  readonly message: string;
}

// Bind only this source snapshot: never resolve imports or execute project code.
// The checker provides lexical identity (including shadowing), not whole-project types.
export const analyzeSource = (filePath: string, content: string) => {
  const file = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, allowJs: true, jsx: ts.JsxEmit.Preserve };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => name === filePath ? file : undefined;
  host.fileExists = (name) => name === filePath;
  host.readFile = (name) => name === filePath ? content : undefined;
  const program = ts.createProgram([filePath], options, host);
  const errors = program.getSyntacticDiagnostics(file);
  if (errors.length) {
    const error = errors[0]!;
    const location = file.getLineAndCharacterOfPosition(error.start ?? 0);
    throw new Error(`Cannot parse ${filePath}:${location.line + 1}:${location.character + 1}: ${ts.flattenDiagnosticMessageText(error.messageText, " ")}`);
  }
  const checker = program.getTypeChecker();
  const nodes: ts.Node[] = [];
  const visit = (node: ts.Node): void => { nodes.push(node); ts.forEachChild(node, visit); };
  visit(file);
  const imports = file.statements.filter(ts.isImportDeclaration);
  const moduleName = (node: ts.ImportDeclaration): string =>
    ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "";
  const binding = (node: ts.Node) => checker.getSymbolAtLocation(node);
  const importName = (node: ts.Node, module: string): string | undefined => {
    node = unwrap(node);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const declaration = binding(unwrap(node.expression))?.declarations?.[0];
      if (declaration && (ts.isNamespaceImport(declaration) || ts.isImportClause(declaration))) {
        let parent: ts.Node = declaration;
        while (!ts.isImportDeclaration(parent)) parent = parent.parent;
        if (moduleName(parent) === module) return propertyName(node);
      }
      return undefined;
    }
    const declaration = binding(node)?.declarations?.[0];
    if (declaration && ts.isImportSpecifier(declaration) && ts.isImportDeclaration(declaration.parent.parent.parent) &&
      moduleName(declaration.parent.parent.parent) === module) {
      return (declaration.propertyName ?? declaration.name).text;
    }
    return undefined;
  };
  const resolveFunction = (node: ts.Node, seen = new Set<ts.Symbol>()): RuntimeFunction | undefined => {
    node = unwrap(node);
    if (isRuntimeFunction(node)) return node;
    if (!ts.isIdentifier(node)) return undefined;
    const symbol = binding(node);
    if (!symbol || seen.has(symbol)) return undefined;
    seen.add(symbol);
    const declaration = symbol.valueDeclaration;
    if (declaration && ts.isFunctionDeclaration(declaration)) return declaration;
    if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer &&
      ts.isVariableDeclarationList(declaration.parent) && (declaration.parent.flags & ts.NodeFlags.Const)) {
      return resolveFunction(declaration.initializer, seen);
    }
    return undefined;
  };
  const isReference = (node: ts.Identifier): boolean => {
    const parent = node.parent;
    if (ts.isShorthandPropertyAssignment(parent) || ts.isExportSpecifier(parent)) return true;
    if ((parent as ts.NamedDeclaration).name === node) return false;
    for (let ancestor: ts.Node | undefined = parent; ancestor && !ts.isStatement(ancestor); ancestor = ancestor.parent) {
      if (ts.isTypeNode(ancestor)) return false;
    }
    return true;
  };
  const references = new Map<ts.Symbol, ts.Identifier[]>();
  for (const node of nodes) {
    if (!ts.isIdentifier(node) || !isReference(node)) continue;
    const symbol = binding(node);
    if (symbol) references.set(symbol, [...(references.get(symbol) ?? []), node]);
  }
  const moduleIsBackground = imports.some((node) => moduleName(node) === "background-only");
  const isBackgroundUse = (node: ts.Node, seen: Set<RuntimeFunction>): boolean => {
    while (node.parent && unwrap(node.parent) === node) node = node.parent;
    const parent = node.parent;
    if (parent && ts.isCallExpression(parent)) {
      const hook = importName(parent.expression, "@lynx-js/react");
      if ((hook === "useEffect" && parent.arguments[0] === node) ||
        (hook === "useImperativeHandle" && parent.arguments[1] === node)) return true;
      if (parent.expression === node) return isBackgroundLocation(parent, seen);
    }
    if (parent && ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent)) {
      const name = parent.parent.name.getText(file);
      const element = parent.parent.parent.parent;
      const native = (ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element)) &&
        ts.isIdentifier(element.tagName) && /^[a-z]/.test(element.tagName.text);
      return native && (name === "ref" || /^(bind|catch)[a-z]/.test(name));
    }
    return false;
  };
  const isBackgroundFunction = (fn: RuntimeFunction, seen: Set<RuntimeFunction>): boolean => {
    if (hasDirective(fn, "main thread")) return false;
    if (hasDirective(fn, "background only")) return true;
    if (seen.has(fn)) return false;
    const next = new Set(seen).add(fn);
    if (isBackgroundUse(fn, next)) return true;
    const declaration = ts.isVariableDeclaration(fn.parent) ? fn.parent : fn;
    if (ts.canHaveModifiers(fn) && ts.getModifiers(fn)?.some((modifier) =>
      modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword)) return false;
    if (ts.isVariableDeclaration(declaration) && ts.isVariableStatement(declaration.parent.parent) &&
      ts.getModifiers(declaration.parent.parent)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) return false;
    const name = declaration.name;
    const symbol = name && ts.isIdentifier(name) ? binding(name) : undefined;
    const uses = symbol ? references.get(symbol) : undefined;
    return !!uses?.length && uses.every((use) => isBackgroundUse(use, next));
  };
  function isBackgroundLocation(node: ts.Node, seen = new Set<RuntimeFunction>()): boolean {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (isRuntimeFunction(parent)) return isBackgroundFunction(parent, seen) ||
        (moduleIsBackground && !hasDirective(parent, "main thread"));
    }
    return moduleIsBackground;
  }
  return { file, nodes, imports, moduleName, binding, importName, resolveFunction, isReference, isBackgroundLocation };
};

export type SourceAnalysis = ReturnType<typeof analyzeSource>;

export const checkThreadSyntax = (analysis: SourceAnalysis): SyntaxFinding[] => {
  const { nodes, binding, isReference, importName, resolveFunction, isBackgroundLocation, file } = analysis;
  const findings: SyntaxFinding[] = [];
  if (file.isDeclarationFile) return findings;
  for (const node of nodes) {
    const nativeGlobal = ts.isIdentifier(node) && node.text === "NativeModules" &&
      isReference(node) && !binding(node);
    const lynxModule = (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      propertyName(node) === "getJSModule" && ts.isIdentifier(node.expression) &&
      node.expression.text === "lynx" && !binding(node.expression);
    if ((nativeGlobal || lynxModule) && !isBackgroundLocation(node)) {
      findings.push({ ruleId: "reactlynx/background-only-api", node,
        message: "This background-only API is read outside a proven background context and may run during main-thread render." });
    }
    if (ts.isCallExpression(node) && importName(node.expression, "@lynx-js/react") === "useLayoutEffect") {
      findings.push({ ruleId: "reactlynx/avoid-use-layout-effect", node,
        message: "ReactLynx does not support React DOM style synchronous layout effects. Use useEffect or main-thread layout events." });
    }
    if (ts.isJsxAttribute(node) && node.name.getText(file).startsWith("main-thread:") &&
      node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
      const fn = resolveFunction(node.initializer.expression);
      if (fn && !hasDirective(fn, "main thread")) {
        findings.push({ ruleId: "reactlynx/main-thread-handler-directive", node,
          message: "This locally resolved main-thread handler must have 'main thread' as its first statement." });
      }
    }
  }
  return findings;
};
