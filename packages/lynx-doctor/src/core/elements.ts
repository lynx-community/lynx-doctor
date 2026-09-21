import ts from "typescript";
import type { SourceAnalysis, SyntaxFinding } from "./syntax.js";

const DOM_ELEMENTS = new Map([
  ["div", "view"], ["span", "text"], ["p", "text"], ["img", "image"],
  ["button", "a view with bindtap, or a UI Button component"],
  ["section", "view"], ["article", "view"], ["header", "view"], ["footer", "view"],
  ["main", "view"], ["nav", "view"], ["ul", "list or view"], ["ol", "list or view"],
  ["li", "list-item or view"], ["h1", "text"], ["h2", "text"], ["h3", "text"]
]);
const NATIVE_ELEMENTS = new Set(["view", "text", "image", "scroll-view", "list", "list-item"]);
const WEB_EVENTS = new Map([
  ["onClick", "bindtap or catchtap"], ["onTouchStart", "bindtouchstart"],
  ["onTouchMove", "bindtouchmove"], ["onTouchEnd", "bindtouchend"], ["onTouchCancel", "bindtouchcancel"]
]);

export const checkElementSyntax = (analysis: SourceAnalysis): SyntaxFinding[] => {
  const findings: SyntaxFinding[] = [];
  for (const node of analysis.nodes) {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) continue;
    if (!ts.isIdentifier(node.tagName)) continue;
    const tag = node.tagName.text;
    const alternative = DOM_ELEMENTS.get(tag);
    if (alternative) findings.push({ ruleId: "reactlynx/no-dom-elements", node: node.tagName,
      message: `<${tag}> is a Web element in a Lynx source file. Use ${alternative}, unless the host explicitly registers this custom element.` });

    const declaration = analysis.binding(node.tagName)?.declarations?.[0];
    const uiButton = analysis.importName(node.tagName, "@lynx-js/lynx-ui") === "Button" ||
      analysis.importName(node.tagName, "@lynx-js/lynx-ui-button") === "Button" ||
      (declaration && ts.isImportClause(declaration) && ts.isImportDeclaration(declaration.parent) &&
        analysis.moduleName(declaration.parent) === "@lynx-js/lynx-ui-button");
    for (const attribute of node.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      const name = attribute.name.getText(analysis.file);
      const nativeEvent = WEB_EVENTS.get(name);
      if (NATIVE_ELEMENTS.has(tag) && nativeEvent) {
        findings.push({ ruleId: "reactlynx/native-element-events", node: attribute,
          message: `<${tag}> uses the Web event prop ${name}; use ${nativeEvent} for this native Lynx element.` });
      }
      if (uiButton && /^(bind|catch)[a-z]/.test(name)) {
        findings.push({ ruleId: "lynx-ui/button-uses-on-click", node: attribute,
          message: "This imported lynx-ui Button uses a native event attribute; its public API exposes onClick." });
      }
    }
  }
  return findings;
};
