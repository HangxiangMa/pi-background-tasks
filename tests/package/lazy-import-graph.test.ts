import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');

function sourcePath(relativePath: string): string {
  return resolve(root, relativePath);
}

function relativeSource(absolutePath: string): string {
  return relative(root, absolutePath).split('\\').join('/');
}

function runtimeImportSpecifier(node: ts.ImportDeclaration): string | undefined {
  if (!ts.isStringLiteral(node.moduleSpecifier)) return undefined;
  const clause = node.importClause;
  if (clause?.isTypeOnly === true) return undefined;
  if (clause === undefined || clause.name !== undefined) return node.moduleSpecifier.text;
  const bindings = clause.namedBindings;
  if (bindings === undefined || ts.isNamespaceImport(bindings)) return node.moduleSpecifier.text;
  return bindings.elements.some((element) => !element.isTypeOnly)
    ? node.moduleSpecifier.text
    : undefined;
}

function resolveSourceImport(fromPath: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const requested = resolve(dirname(fromPath), specifier);
  const candidates = extname(requested) === '.js'
    ? [`${requested.slice(0, -3)}.ts`, requested]
    : [requested, `${requested}.ts`, join(requested, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate));
}

async function runtimeStaticGraph(entry: string): Promise<Set<string>> {
  const pending = [sourcePath(entry)];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || visited.has(current)) continue;
    visited.add(current);
    if (extname(current) !== '.ts') continue;
    const source = await readFile(current, 'utf8');
    const tree = ts.createSourceFile(current, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      const specifier = runtimeImportSpecifier(statement);
      if (specifier === undefined) continue;
      const target = resolveSourceImport(current, specifier);
      if (target !== undefined) pending.push(target);
    }
  }
  return new Set([...visited].map(relativeSource));
}

async function dynamicImports(path: string): Promise<Set<string>> {
  const absolutePath = sourcePath(path);
  const source = await readFile(absolutePath, 'utf8');
  const tree = ts.createSourceFile(absolutePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = new Set<string>();
  const visit = (node: ts.Node): void => {
    const argument = ts.isCallExpression(node) ? node.arguments[0] : undefined;
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      argument !== undefined &&
      ts.isStringLiteral(argument)
    ) {
      out.add(argument.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return out;
}

void describe('lazy facade runtime import graph', () => {
  void it('keeps delegate launch, budget, runner, and both result verifiers out of static startup', async () => {
    const graph = await runtimeStaticGraph('src/delegate-extension.ts');
    for (const forbidden of [
      'src/core/delegate/budget.ts',
      'src/core/delegate/launch.ts',
      'src/core/delegate/runner.ts',
      'src/core/delegate/seed.ts',
      'src/core/delegate/result-package.ts',
      'src/core/fusion/result-package.ts',
    ]) {
      assert.equal(graph.has(forbidden), false, `${forbidden} leaked into delegate facade startup`);
    }
  });

  void it('keeps Fusion context, config, orchestrator, verifier, and selector out of static startup', async () => {
    const graph = await runtimeStaticGraph('src/fusion-extension.ts');
    for (const forbidden of [
      'src/core/fusion/context.ts',
      'src/core/fusion/clean-context.ts',
      'src/core/fusion/config.ts',
      'src/core/fusion/orchestrator.ts',
      'src/core/fusion/result-package.ts',
      'src/ui/fusion-model-selector.ts',
    ]) {
      assert.equal(graph.has(forbidden), false, `${forbidden} leaked into Fusion facade startup`);
    }
  });

  void it('uses literal deferred targets and keeps every target inside the shipped src closure', async () => {
    const delegate = await dynamicImports('src/delegate-extension.ts');
    const fusion = await dynamicImports('src/fusion-extension.ts');
    for (const expected of [
      './core/delegate/launch.js',
      './core/delegate/runner.js',
      './core/fusion/result-package.js',
    ]) {
      assert.ok(delegate.has(expected), `delegate facade must defer ${expected}`);
    }
    for (const expected of [
      './core/fusion/context.js',
      './core/fusion/clean-context.js',
      './core/fusion/config.js',
      './core/fusion/orchestrator.js',
      './ui/fusion-model-selector.js',
    ]) {
      assert.ok(fusion.has(expected), `Fusion facade must defer ${expected}`);
    }
    for (const [facade, imports] of [
      ['src/delegate-extension.ts', delegate],
      ['src/fusion-extension.ts', fusion],
    ] as const) {
      for (const specifier of imports) {
        const target = resolveSourceImport(sourcePath(facade), specifier);
        assert.ok(target, `missing deferred payload target ${facade} -> ${specifier}`);
        assert.match(relativeSource(target), /^src\//u, 'deferred runtime bytes must stay under package src/');
      }
    }
    const manifest = JSON.parse(await readFile(sourcePath('package.json'), 'utf8')) as {
      files?: string[];
    };
    assert.ok(manifest.files?.includes('src/'), 'package payload must include all deferred src targets');
  });

  void it('keeps extracted facade constants byte/value equivalent to engine consumers', async () => {
    const [delegateContract, delegateBudget, fusionContract, fusionConfig] = await Promise.all([
      import('../../src/core/delegate/facade-contract.js'),
      import('../../src/core/delegate/budget.js'),
      import('../../src/core/fusion/facade-contract.js'),
      import('../../src/core/fusion/config.js'),
    ]);
    for (const name of [
      'DELEGATE_DEFAULT_MAX_TURNS',
      'DELEGATE_DEFAULT_MAX_TOOL_CALLS',
      'DELEGATE_DEFAULT_TIMEOUT_SECONDS',
      'DELEGATE_INLINE_ANSWER_BYTES',
    ] as const) {
      assert.equal(delegateContract[name], delegateBudget[name], `${name} drifted after extraction`);
    }
    assert.equal(fusionContract.CURRENT_MODEL_SELECTION, '$current');
    assert.equal(fusionConfig.CURRENT_MODEL_SELECTION, fusionContract.CURRENT_MODEL_SELECTION);
    assert.deepEqual(fusionConfig.defaultFusionModelConfig(), {
      schema_version: 'pi-background-tasks.fusion-models.v1',
      candidates: ['$current', '$current', '$current'],
      evaluator: '$current',
      merger: '$current',
    });
  });

  void it('records the P1a process-only limitation without pretending facades are absent', async () => {
    const extensionSource = await readFile(sourcePath('src/extension.ts'), 'utf8');
    assert.match(extensionSource, /from ['"]\.\/delegate-extension\.js['"]/u);
    assert.match(extensionSource, /from ['"]\.\/fusion-extension\.js['"]/u);
    assert.match(
      extensionSource,
      /if \(config\.features\.delegate\)|if \(config\.features\.fusion\)/u,
      'facades must still only be instantiated by enabled conditional registrars',
    );
    const closeBarrier = extensionSource.indexOf('activationCloseFence.close()');
    const fusionRegistration = extensionSource.indexOf('registerFusionExtension(pi, {');
    const delegateRegistration = extensionSource.indexOf('registerDelegateExtension(pi, {');
    const resultRegistration = extensionSource.indexOf('registerBackgroundResultExtension(pi, {');
    assert.ok(closeBarrier >= 0, 'the composed activation must install its close fence');
    for (const registration of [fusionRegistration, delegateRegistration, resultRegistration]) {
      assert.ok(
        registration > closeBarrier,
        'the one synchronous close barrier must be registered before every lazy facade',
      );
    }
  });
});
