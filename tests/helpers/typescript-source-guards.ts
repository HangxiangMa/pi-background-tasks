import ts from 'typescript';

export type TypeSafetyRule =
  | 'explicit top-type escape'
  | 'compiler suppression'
  | 'double assertion'
  | 'non-null assertion';

export interface TypeSafetyViolation {
  readonly file: string;
  readonly line: number;
  readonly rule: TypeSafetyRule;
  readonly text: string;
}

export interface FileUrlPathnameViolation {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

export interface TypeSafetyScanOptions {
  readonly escapeHatches: boolean;
  readonly nonNullAssertions: boolean;
}

interface CompilerCommentDirective {
  readonly range: ts.TextRange;
}

interface CompilerCheckDirective extends ts.TextRange {
  readonly enabled: boolean;
}

interface SourceFileCompilerMetadata extends ts.SourceFile {
  readonly commentDirectives?: readonly CompilerCommentDirective[];
  readonly checkJsDirective?: CompilerCheckDirective;
}

function scriptKind(fileName: string): ts.ScriptKind {
  return fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function parseSource(fileName: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(fileName),
  );
}

function lineText(sourceFile: ts.SourceFile, position: number): string {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  const starts = sourceFile.getLineStarts();
  const start = starts[location.line] ?? 0;
  const end = sourceFile.getLineEndOfPosition(position);
  return sourceFile.text.slice(start, end).trim();
}

function compactNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
  return node.getText(sourceFile).replace(/\s+/gu, ' ').trim().slice(0, 180);
}

function violationAt(
  sourceFile: ts.SourceFile,
  file: string,
  rule: TypeSafetyRule,
  position: number,
  text = lineText(sourceFile, position),
): TypeSafetyViolation {
  return {
    file,
    line: sourceFile.getLineAndCharacterOfPosition(position).line + 1,
    rule,
    text,
  };
}

function isTypeAssertion(node: ts.Node): node is ts.AsExpression | ts.TypeAssertion {
  return ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);
}

function unwrapParentheses(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
}

export function findTypeSafetyViolations(
  file: string,
  source: string,
  options: TypeSafetyScanOptions,
): TypeSafetyViolation[] {
  const sourceFile = parseSource(file, source);
  const metadata = sourceFile as SourceFileCompilerMetadata;
  const violations: TypeSafetyViolation[] = [];

  if (options.escapeHatches) {
    for (const directive of metadata.commentDirectives ?? []) {
      violations.push(
        violationAt(sourceFile, file, 'compiler suppression', directive.range.pos),
      );
    }
    if (metadata.checkJsDirective?.enabled === false) {
      violations.push(
        violationAt(sourceFile, file, 'compiler suppression', metadata.checkJsDirective.pos),
      );
    }
  }

  const visit = (node: ts.Node): void => {
    if (options.escapeHatches && node.kind === ts.SyntaxKind.AnyKeyword) {
      violations.push(
        violationAt(
          sourceFile,
          file,
          'explicit top-type escape',
          node.getStart(sourceFile),
          compactNodeText(node, sourceFile),
        ),
      );
    }
    if (
      options.escapeHatches &&
      isTypeAssertion(node) &&
      isTypeAssertion(unwrapParentheses(node.expression))
    ) {
      violations.push(
        violationAt(
          sourceFile,
          file,
          'double assertion',
          node.getStart(sourceFile),
          compactNodeText(node, sourceFile),
        ),
      );
    }
    if (options.nonNullAssertions && ts.isNonNullExpression(node)) {
      violations.push(
        violationAt(
          sourceFile,
          file,
          'non-null assertion',
          node.getStart(sourceFile),
          compactNodeText(node, sourceFile),
        ),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return violations.sort(
    (left, right) => left.line - right.line || left.rule.localeCompare(right.rule),
  );
}

interface BoundSource {
  readonly checker: ts.TypeChecker;
  readonly sourceFile: ts.SourceFile;
}

function bindSource(fileName: string, source: string): BoundSource {
  const parsed = parseSource(fileName, source);
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    noLib: true,
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const host: ts.CompilerHost = {
    fileExists: (candidate) => candidate === fileName,
    getCanonicalFileName: (candidate) => candidate,
    getCurrentDirectory: () => '',
    getDefaultLibFileName: () => 'lib.d.ts',
    getNewLine: () => '\n',
    getSourceFile: (candidate) => (candidate === fileName ? parsed : undefined),
    readFile: (candidate) => (candidate === fileName ? source : undefined),
    useCaseSensitiveFileNames: () => true,
    writeFile: () => undefined,
  };
  const program = ts.createProgram([fileName], options, host);
  const sourceFile = program.getSourceFile(fileName);
  if (sourceFile === undefined) throw new Error(`failed to bind ${fileName}`);
  return { checker: program.getTypeChecker(), sourceFile };
}

function unwrapForProvenance(expression: ts.Expression): ts.Expression {
  let current = expression;
  for (;;) {
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current)
    ) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

function moduleSpecifierFor(node: ts.Node): string | undefined {
  let current: ts.Node | undefined = node;
  while (current !== undefined && !ts.isImportDeclaration(current)) current = current.parent;
  if (current === undefined || !ts.isStringLiteral(current.moduleSpecifier)) return undefined;
  return current.moduleSpecifier.text;
}

function importedName(declaration: ts.ImportSpecifier): string {
  return (declaration.propertyName ?? declaration.name).text;
}

function isNodeUrlModule(specifier: string | undefined): boolean {
  return specifier === 'node:url' || specifier === 'url';
}

function literalProtocol(expression: ts.Expression): string | undefined {
  const current = unwrapForProvenance(expression);
  if (!ts.isStringLiteral(current) && !ts.isNoSubstitutionTemplateLiteral(current)) {
    return undefined;
  }
  const match = /^([A-Za-z][A-Za-z\d+.-]*):/u.exec(current.text);
  return match?.[1]?.toLowerCase();
}

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  if (ts.isComputedPropertyName(name)) {
    const expression = unwrapForProvenance(name.expression);
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
      return expression.text;
    }
  }
  return undefined;
}

function elementAccessName(expression: ts.ElementAccessExpression): string | undefined {
  const argument = expression.argumentExpression;
  if (argument === undefined) return undefined;
  const current = unwrapForProvenance(argument);
  return ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)
    ? current.text
    : undefined;
}

function isImportMeta(expression: ts.Expression): boolean {
  const current = unwrapForProvenance(expression);
  return (
    ts.isMetaProperty(current) &&
    current.keywordToken === ts.SyntaxKind.ImportKeyword &&
    current.name.text === 'meta'
  );
}

function symbolExpressions(
  symbol: ts.Symbol,
  assignments: ReadonlyMap<ts.Symbol, readonly ts.Expression[]>,
): ts.Expression[] {
  const expressions = [...(assignments.get(symbol) ?? [])];
  for (const declaration of symbol.declarations ?? []) {
    if (
      ts.isVariableDeclaration(declaration) &&
      ts.isIdentifier(declaration.name) &&
      declaration.initializer !== undefined
    ) {
      expressions.push(declaration.initializer);
    }
  }
  return expressions;
}

function withUnseenSymbol(
  symbol: ts.Symbol,
  seen: Set<ts.Symbol>,
  evaluate: () => boolean,
): boolean {
  if (seen.has(symbol)) return false;
  seen.add(symbol);
  try {
    return evaluate();
  } finally {
    seen.delete(symbol);
  }
}

function isImportedBinding(
  identifier: ts.Identifier,
  checker: ts.TypeChecker,
  expectedName: string,
): boolean {
  const symbol = checker.getSymbolAtLocation(identifier);
  return (
    symbol?.declarations?.some(
      (declaration) =>
        ts.isImportSpecifier(declaration) &&
        importedName(declaration) === expectedName &&
        isNodeUrlModule(moduleSpecifierFor(declaration)),
    ) === true
  );
}

function isNodeUrlNamespace(expression: ts.Expression, checker: ts.TypeChecker): boolean {
  const current = unwrapForProvenance(expression);
  if (!ts.isIdentifier(current)) return false;
  const symbol = checker.getSymbolAtLocation(current);
  return (
    symbol?.declarations?.some(
      (declaration) =>
        ts.isNamespaceImport(declaration) && isNodeUrlModule(moduleSpecifierFor(declaration)),
    ) === true
  );
}

function collectAssignments(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ReadonlyMap<ts.Symbol, readonly ts.Expression[]> {
  const mutable = new Map<ts.Symbol, ts.Expression[]>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      const symbol = checker.getSymbolAtLocation(node.left);
      if (symbol !== undefined) {
        const values = mutable.get(symbol) ?? [];
        values.push(node.right);
        mutable.set(symbol, values);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return mutable;
}

interface FileUrlProvenance {
  readonly checker: ts.TypeChecker;
  readonly assignments: ReadonlyMap<ts.Symbol, readonly ts.Expression[]>;
}

function isUrlConstructor(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  const current = unwrapForProvenance(expression);
  if (ts.isIdentifier(current)) {
    const symbol = provenance.checker.getSymbolAtLocation(current);
    if (isImportedBinding(current, provenance.checker, 'URL')) return true;
    if (symbol === undefined) return current.text === 'URL';
    return withUnseenSymbol(symbol, seen, () => {
      const expressions = symbolExpressions(symbol, provenance.assignments);
      if (expressions.length === 0) return false;
      return expressions.some((value) => isUrlConstructor(value, provenance, seen));
    });
  }
  if (ts.isPropertyAccessExpression(current)) {
    return (
      current.name.text === 'URL' &&
      (isNodeUrlNamespace(current.expression, provenance.checker) ||
        (ts.isIdentifier(current.expression) && current.expression.text === 'globalThis'))
    );
  }
  return false;
}

function isPathToFileUrlFunction(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  const current = unwrapForProvenance(expression);
  if (ts.isIdentifier(current)) {
    const symbol = provenance.checker.getSymbolAtLocation(current);
    if (isImportedBinding(current, provenance.checker, 'pathToFileURL')) return true;
    if (symbol === undefined) return current.text === 'pathToFileURL';
    return withUnseenSymbol(symbol, seen, () =>
      symbolExpressions(symbol, provenance.assignments).some((value) =>
        isPathToFileUrlFunction(value, provenance, seen),
      ),
    );
  }
  return (
    ts.isPropertyAccessExpression(current) &&
    current.name.text === 'pathToFileURL' &&
    isNodeUrlNamespace(current.expression, provenance.checker)
  );
}

function isImportMetaObject(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  const current = unwrapForProvenance(expression);
  if (isImportMeta(current)) return true;
  if (!ts.isIdentifier(current)) return false;
  const symbol = provenance.checker.getSymbolAtLocation(current);
  if (symbol === undefined) return false;
  return withUnseenSymbol(symbol, seen, () =>
    symbolExpressions(symbol, provenance.assignments).some((value) =>
      isImportMetaObject(value, provenance, seen),
    ),
  );
}

function isImportMetaUrl(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  const current = unwrapForProvenance(expression);
  if (ts.isPropertyAccessExpression(current) && current.name.text === 'url') {
    return isImportMetaObject(current.expression, provenance, seen);
  }
  if (ts.isElementAccessExpression(current) && elementAccessName(current) === 'url') {
    return isImportMetaObject(current.expression, provenance, seen);
  }
  return false;
}

function protocolFromExpression(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): string | undefined {
  const direct = literalProtocol(expression);
  if (direct !== undefined) return direct;
  const current = unwrapForProvenance(expression);
  if (!ts.isIdentifier(current)) return undefined;
  const symbol = provenance.checker.getSymbolAtLocation(current);
  if (symbol === undefined) return undefined;
  let protocol: string | undefined;
  withUnseenSymbol(symbol, seen, () => {
    for (const value of symbolExpressions(symbol, provenance.assignments)) {
      const candidate = protocolFromExpression(value, provenance, seen);
      if (candidate !== undefined) {
        protocol = candidate;
        return true;
      }
    }
    return false;
  });
  return protocol;
}

function isFileUrlBase(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  if (protocolFromExpression(expression, provenance, seen) === 'file') return true;
  if (isImportMetaUrl(expression, provenance, seen)) return true;
  if (isFileUrlObject(expression, provenance, seen)) return true;
  const current = unwrapForProvenance(expression);
  if (!ts.isIdentifier(current)) return false;
  const symbol = provenance.checker.getSymbolAtLocation(current);
  if (symbol === undefined) return false;
  return withUnseenSymbol(symbol, seen, () =>
    symbolExpressions(symbol, provenance.assignments).some((value) =>
      isFileUrlBase(value, provenance, seen),
    ),
  );
}

function isFileUrlObject(
  expression: ts.Expression,
  provenance: FileUrlProvenance,
  seen: Set<ts.Symbol>,
): boolean {
  const current = unwrapForProvenance(expression);
  if (ts.isNewExpression(current) && isUrlConstructor(current.expression, provenance, seen)) {
    const first = current.arguments?.[0];
    if (first === undefined) return false;
    const protocol = protocolFromExpression(first, provenance, seen);
    if (protocol !== undefined) return protocol === 'file';
    const base = current.arguments?.[1];
    return base === undefined
      ? isFileUrlBase(first, provenance, seen)
      : isFileUrlBase(base, provenance, seen);
  }
  if (
    ts.isCallExpression(current) &&
    isPathToFileUrlFunction(current.expression, provenance, seen)
  ) {
    return true;
  }
  if (!ts.isIdentifier(current)) return false;
  const symbol = provenance.checker.getSymbolAtLocation(current);
  if (symbol === undefined) return false;
  return withUnseenSymbol(symbol, seen, () =>
    symbolExpressions(symbol, provenance.assignments).some((value) =>
      isFileUrlObject(value, provenance, seen),
    ),
  );
}

function pathnameReceiver(node: ts.Node): ts.Expression | undefined {
  if (ts.isPropertyAccessExpression(node) && node.name.text === 'pathname') {
    return node.expression;
  }
  if (ts.isElementAccessExpression(node) && elementAccessName(node) === 'pathname') {
    return node.expression;
  }
  return undefined;
}

export function findFileUrlPathnameViolations(
  file: string,
  source: string,
): FileUrlPathnameViolation[] {
  const { checker, sourceFile } = bindSource(file, source);
  const provenance: FileUrlProvenance = {
    checker,
    assignments: collectAssignments(sourceFile, checker),
  };
  const violations: FileUrlPathnameViolation[] = [];
  const add = (node: ts.Node): void => {
    const position = node.getStart(sourceFile);
    violations.push({
      file,
      line: sourceFile.getLineAndCharacterOfPosition(position).line + 1,
      text: compactNodeText(node, sourceFile),
    });
  };
  const visit = (node: ts.Node): void => {
    const receiver = pathnameReceiver(node);
    if (receiver !== undefined && isFileUrlObject(receiver, provenance, new Set())) add(node);

    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer !== undefined &&
      isFileUrlObject(node.initializer, provenance, new Set())
    ) {
      for (const element of node.name.elements) {
        const name = element.propertyName ?? element.name;
        if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) continue;
        if (propertyNameText(name) === 'pathname') add(element);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return violations.sort((left, right) => left.line - right.line);
}
