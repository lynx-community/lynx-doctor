export class SourceParseError extends Error {
  constructor(
    filePath: string,
    readonly line: number,
    readonly column: number,
    readonly reason: string,
  ) {
    super(`Cannot parse ${filePath}:${line}:${column}: ${reason}`);
    this.name = "SourceParseError";
  }
}
