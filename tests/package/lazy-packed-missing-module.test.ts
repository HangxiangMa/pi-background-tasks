import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, it } from 'node:test';
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type AgentSession,
} from '@earendil-works/pi-coding-agent';

const execFileAsync = promisify(execFile);
const packageRoot = resolve(import.meta.dirname, '../..');
const roots: string[] = [];

function parsePackFilename(stdout: string): string {
  const trimmed = stdout.trim();
  const start = trimmed.startsWith('[') ? 0 : stdout.lastIndexOf('\n[') + 1;
  assert.ok(start > 0 || trimmed.startsWith('['), 'npm pack must emit a JSON array');
  const parsed: unknown = JSON.parse(start === 0 ? trimmed : stdout.slice(start).trim());
  assert.ok(Array.isArray(parsed));
  const first: unknown = parsed[0];
  assert.ok(typeof first === 'object' && first !== null);
  const filename: unknown = Reflect.get(first, 'filename');
  if (typeof filename !== 'string') throw new Error('npm pack filename must be a string');
  return filename;
}

async function runNpmPack(root: string, destination: string): Promise<string> {
  const configDir = join(root, 'config');
  const home = join(root, 'home');
  const temporary = join(root, 'tmp');
  const cache = join(root, 'cache');
  await Promise.all([
    mkdir(configDir, { recursive: true }),
    mkdir(home, { recursive: true }),
    mkdir(temporary, { recursive: true }),
    mkdir(cache, { recursive: true }),
    mkdir(destination, { recursive: true }),
  ]);
  const userConfig = join(configDir, 'user.npmrc');
  const globalConfig = join(configDir, 'global.npmrc');
  await Promise.all([writeFile(userConfig, '', 'utf8'), writeFile(globalConfig, '', 'utf8')]);
  const env: NodeJS.ProcessEnv = {
    PATH: process.env['PATH'] ?? '',
    HOME: home,
    USERPROFILE: home,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    NPM_CONFIG_CACHE: cache,
    npm_config_cache: cache,
    NPM_CONFIG_USERCONFIG: userConfig,
    npm_config_userconfig: userConfig,
    NPM_CONFIG_GLOBALCONFIG: globalConfig,
    npm_config_globalconfig: globalConfig,
    NPM_CONFIG_REGISTRY: 'http://127.0.0.1.invalid/',
    npm_config_registry: 'http://127.0.0.1.invalid/',
    GIT_ALLOW_PROTOCOL: 'file',
    PI_OFFLINE: '1',
    PI_SKIP_VERSION_CHECK: '1',
    PI_TELEMETRY: '0',
    CI: '1',
  };
  const npmCli = process.env['npm_execpath'];
  const command = npmCli === undefined ? 'npm' : process.execPath;
  const prefix = npmCli === undefined ? [] : [npmCli];
  const result = await execFileAsync(
    command,
    [
      ...prefix,
      'pack',
      packageRoot,
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      destination,
    ],
    { cwd: root, env, maxBuffer: 8 * 1024 * 1024 },
  );
  return join(destination, parsePackFilename(result.stdout));
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail('expected deferred invocation to fail');
}

async function close(session: AgentSession): Promise<void> {
  await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
  session.dispose();
}

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

void describe('packed lazy-module closure', { concurrency: false }, () => {
  void it('starts with a removed deferred module and fails only when its producer is invoked', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pi-bg-lazy-packed-'));
    roots.push(root);
    const tarballs = join(root, 'tarballs');
    const unpacked = join(root, 'unpacked');
    const tarball = await runNpmPack(root, tarballs);
    await mkdir(unpacked, { recursive: true });
    await execFileAsync('tar', ['-xzf', tarball, '-C', unpacked], { cwd: root });
    const packedRoot = join(unpacked, 'package');
    const deferredModule = join(packedRoot, 'src/core/delegate/runner.ts');
    assert.ok(existsSync(deferredModule), 'the real tarball must close over the deferred module');
    await rm(deferredModule);
    await symlink(
      realpathSync(join(packageRoot, 'node_modules')),
      join(packedRoot, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );

    const cwd = join(root, 'project');
    const agentDir = join(root, 'agent');
    await Promise.all([mkdir(cwd, { recursive: true }), mkdir(agentDir, { recursive: true })]);
    const previous = {
      features: process.env['PI_BG_FEATURES'],
      shortcut: process.env['PI_BG_DOCK_SHORTCUT'],
      agentDir: process.env['PI_CODING_AGENT_DIR'],
    };
    process.env['PI_BG_FEATURES'] = 'process,delegate';
    process.env['PI_BG_DOCK_SHORTCUT'] = 'off';
    process.env['PI_CODING_AGENT_DIR'] = agentDir;
    const settingsManager = SettingsManager.inMemory();
    const loader = new DefaultResourceLoader({
      cwd,
      agentDir,
      settingsManager,
      additionalExtensionPaths: [join(packedRoot, 'extensions/background-tasks.ts')],
      noExtensions: true,
      noSkills: true,
      noPromptTemplates: true,
      noContextFiles: true,
      noThemes: true,
    });
    let session: AgentSession | undefined;
    try {
      await loader.reload();
      assert.deepEqual(loader.getExtensions().errors, []);
      const registered = loader
        .getExtensions()
        .extensions.flatMap((extension) => [...extension.tools.keys()]);
      assert.ok(registered.includes('bg_delegate'));
      assert.ok(registered.includes('bg_result'));

      const modelRuntime = await ModelRuntime.create({
        authPath: join(agentDir, 'auth.json'),
        modelsPath: null,
      });
      const created = await createAgentSession({
        cwd,
        agentDir,
        resourceLoader: loader,
        settingsManager,
        modelRuntime,
        sessionManager: SessionManager.inMemory(cwd),
        noTools: 'builtin',
      });
      session = created.session;
      const activeSession = created.session;
      await activeSession.bindExtensions({ mode: 'json' });
      const delegate = activeSession.getToolDefinition('bg_delegate');
      assert.ok(delegate);
      const invoke = () =>
        delegate.execute(
          'packed-missing-module',
          { name: 'Missing bytes', prompt: 'Do not launch.' },
          undefined,
          undefined,
          activeSession.extensionRunner.createContext(),
        );
      const first = await rejection(invoke());
      const second = await rejection(invoke());
      assert.equal(first, second, 'missing-module failure must be sticky for the activation');
      assert.ok(first instanceof Error);
      assert.match(first.message, /lazy_module_load_failed.*delegate-producer/);
      assert.match(first.message, /runner/u);
      assert.equal(existsSync(join(cwd, '.pi/delegate')), false);
    } finally {
      if (session !== undefined) await close(session);
      if (previous.features === undefined) Reflect.deleteProperty(process.env, 'PI_BG_FEATURES');
      else process.env['PI_BG_FEATURES'] = previous.features;
      if (previous.shortcut === undefined)
        Reflect.deleteProperty(process.env, 'PI_BG_DOCK_SHORTCUT');
      else process.env['PI_BG_DOCK_SHORTCUT'] = previous.shortcut;
      if (previous.agentDir === undefined)
        Reflect.deleteProperty(process.env, 'PI_CODING_AGENT_DIR');
      else process.env['PI_CODING_AGENT_DIR'] = previous.agentDir;
    }
  });
});
