import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import {
  createAgentSession,
  createEventBus,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type AgentSession,
  type EventBus,
  type ExtensionRunner,
  type ExtensionUIContext,
  type LoadExtensionsResult,
} from '@earendil-works/pi-coding-agent';
import { matchesKey, type KeyId } from '@earendil-works/pi-tui';
import {
  BG_REQUEST_CHANNEL,
  BG_REQUEST_SCHEMA,
  BG_RESPONSE_CHANNEL,
  BG_RESPONSE_SCHEMA,
} from '../../src/core/extension-api.js';

const ambientAttributionPath = resolve('extensions/anthropic-attribution.ts');
const childAttributionPath = resolve('extensions/anthropic-attribution-child.ts');
const backgroundPath = resolve('extensions/background-tasks.ts');
const shortcutOwnerPath = resolve('tests/fixtures/shortcut-owner.ts');
const FEATURE_ENV_KEYS = ['PI_BG_FEATURES', 'PI_BG_DOCK_SHORTCUT'] as const;
const roots: string[] = [];
const originalEnv = new Map<string, string | undefined>(
  FEATURE_ENV_KEYS.map((key) => [key, process.env[key]]),
);

const PROCESS_TOOLS = ['bg_kill', 'bg_logs', 'bg_run', 'bg_status'] as const;
const PROCESS_COMMANDS = [
  'bg',
  'bg-clear',
  'bg-tasks',
  'bg-update',
  'jobs',
  'kill',
  'logs',
  'tasks',
] as const;
const FUSION_TOOLS = [
  'fusion_investigate',
  'fusion_reason',
  'fusion_research',
  'fusion_validate',
] as const;
const FUSION_COMMANDS = ['fusion', 'fusion-models'] as const;
const ADVANCED_TOOLS = [
  'bg_delegate',
  'bg_result',
  'bg_run_pi_attested',
  ...FUSION_TOOLS,
] as const;

interface RegistrationInventory {
  tools: string[];
  commands: string[];
  shortcuts: string[];
  renderers: string[];
}

function setEnv(key: (typeof FEATURE_ENV_KEYS)[number], value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else process.env[key] = value;
}

function configure(features?: string, shortcut?: string): void {
  setEnv('PI_BG_FEATURES', features);
  setEnv('PI_BG_DOCK_SHORTCUT', shortcut);
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function inventory(result: LoadExtensionsResult): RegistrationInventory {
  return {
    tools: sorted(result.extensions.flatMap((extension) => [...extension.tools.keys()])),
    commands: sorted(result.extensions.flatMap((extension) => [...extension.commands.keys()])),
    shortcuts: sorted(result.extensions.flatMap((extension) => [...extension.shortcuts.keys()])),
    renderers: sorted(
      result.extensions.flatMap((extension) => [...extension.messageRenderers.keys()]),
    ),
  };
}

function expectedInventory(features: ReadonlySet<string>, shortcut = 'shift+down'): RegistrationInventory {
  const tools: string[] = [...PROCESS_TOOLS];
  const commands: string[] = [...PROCESS_COMMANDS];
  const renderers: string[] = ['background-task-notification'];
  const shortcuts: string[] = ['ctrl+alt+c'];
  if (features.has('delegate')) tools.push('bg_delegate');
  if (features.has('delegate') || features.has('fusion')) tools.push('bg_result');
  if (features.has('attested')) tools.push('bg_run_pi_attested');
  if (features.has('fusion')) {
    tools.push(...FUSION_TOOLS);
    commands.push(...FUSION_COMMANDS);
    renderers.push('fusion-result');
  }
  if (features.has('attribution')) commands.push('claude-cache');
  if (shortcut !== 'off') shortcuts.push(shortcut);
  return {
    tools: sorted(tools),
    commands: sorted(commands),
    shortcuts: sorted(shortcuts),
    renderers: sorted(renderers),
  };
}

async function makeRoot(prefix: string): Promise<{ root: string; cwd: string; agentDir: string }> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  roots.push(root);
  const cwd = join(root, 'project');
  const agentDir = join(root, 'agent');
  await Promise.all([mkdir(cwd, { recursive: true }), mkdir(agentDir, { recursive: true })]);
  return { root, cwd, agentDir };
}

async function loadPackage(
  options: { extraPaths?: string[]; paths?: string[] } = {},
): Promise<{ loader: DefaultResourceLoader; result: LoadExtensionsResult; cwd: string; agentDir: string }> {
  const { cwd, agentDir } = await makeRoot('pi-bg-feature-loader-');
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager: SettingsManager.inMemory(),
    eventBus: createEventBus(),
    additionalExtensionPaths:
      options.paths ?? [ambientAttributionPath, ...(options.extraPaths ?? []), backgroundPath],
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noContextFiles: true,
    noThemes: true,
  });
  await loader.reload();
  return { loader, result: loader.getExtensions(), cwd, agentDir };
}

interface SessionHarness {
  session: AgentSession;
  loader: DefaultResourceLoader;
  eventBus: EventBus;
  cwd: string;
  agentDir: string;
}

async function makeSession(extraPaths: string[] = []): Promise<SessionHarness> {
  const { cwd, agentDir } = await makeRoot('pi-bg-feature-session-');
  const settingsManager = SettingsManager.inMemory();
  const eventBus = createEventBus();
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager,
    eventBus,
    additionalExtensionPaths: [ambientAttributionPath, ...extraPaths, backgroundPath],
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noContextFiles: true,
    noThemes: true,
  });
  await loader.reload();
  assert.deepEqual(loader.getExtensions().errors, []);
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
  assert.deepEqual(created.extensionsResult.errors, []);
  await created.session.bindExtensions({
    onError: (error) => assert.fail(`extension error: ${error.event}: ${error.error}`),
  });
  return { session: created.session, loader, eventBus, cwd, agentDir };
}

function sessionInventory(session: AgentSession): RegistrationInventory {
  const runner = session.extensionRunner;
  const toolNames = [
    ...PROCESS_TOOLS,
    ...ADVANCED_TOOLS,
  ].filter((name) => session.getToolDefinition(name) !== undefined);
  return {
    tools: sorted(toolNames),
    commands: sorted(runner.getRegisteredCommands().map((command) => command.invocationName)),
    shortcuts: sorted(runner.getShortcuts({}).keys()),
    renderers: sorted(
      ['background-task-notification', 'fusion-result'].filter(
        (name) => runner.getMessageRenderer(name) !== undefined,
      ),
    ),
  };
}

async function closeSession(session: AgentSession): Promise<void> {
  await session.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
  session.dispose();
}

async function dispatchEncodedKey(
  runner: ExtensionRunner,
  data: string,
): Promise<KeyId | undefined> {
  for (const [key, shortcut] of runner.getShortcuts({})) {
    if (!matchesKey(data, key)) continue;
    await shortcut.handler(runner.createContext());
    return key;
  }
  return undefined;
}

function uiWithDispatchCounters(
  base: ExtensionUIContext,
  customCalls: { value: number },
  statuses: string[],
): ExtensionUIContext {
  return {
    ...base,
    setStatus: (_key, text) => {
      if (text !== undefined) statuses.push(text);
    },
    custom: (async () => {
      customCalls.value += 1;
      return undefined;
    }) as ExtensionUIContext['custom'],
  };
}

async function executeTool(session: AgentSession, name: string, params: unknown): Promise<unknown> {
  const tool = session.getToolDefinition(name);
  assert.ok(tool, `missing tool ${name}`);
  return tool.execute(
    `feature-${name}`,
    params,
    undefined,
    undefined,
    session.extensionRunner.createContext(),
  );
}

afterEach(async () => {
  for (const key of FEATURE_ENV_KEYS) setEnv(key, originalEnv.get(key));
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

void describe('C1a feature selection and dock configuration', { concurrency: false }, () => {
  void it('keeps the default full public registration surface', async () => {
    configure(undefined, undefined);
    const { session } = await makeSession();
    try {
      const all = new Set(['process', 'delegate', 'fusion', 'attested', 'attribution']);
      assert.deepEqual(sessionInventory(session), expectedInventory(all));
      for (const name of [...PROCESS_TOOLS, ...ADVANCED_TOOLS]) {
        assert.ok(session.getActiveToolNames().includes(name), `${name} should be active by default`);
      }
    } finally {
      await closeSession(session);
    }
  });

  void it('activates the exact surface for all 16 optional-capability subsets', async () => {
    const optional = ['delegate', 'fusion', 'attested', 'attribution'] as const;
    for (let mask = 0; mask < 1 << optional.length; mask += 1) {
      const enabled = optional.filter((_feature, index) => (mask & (1 << index)) !== 0);
      const features = new Set<string>(['process', ...enabled]);
      configure([...features].join(','), undefined);
      const { result } = await loadPackage();
      assert.deepEqual(result.errors, [], `load errors for ${[...features].join(',')}`);
      const actual = inventory(result);
      assert.deepEqual(actual, expectedInventory(features), `inventory for ${[...features].join(',')}`);
      assert.equal(
        actual.tools.filter((name) => name === 'bg_result').length,
        features.has('delegate') || features.has('fusion') ? 1 : 0,
      );
    }
  });

  void it('fails malformed settings before any package registration with bounded diagnostics', async () => {
    const invalidCases: Array<{ features?: string; shortcut?: string; expected: RegExp }> = [
      { features: '', expected: /PI_BG_FEATURES.*empty/i },
      { features: 'process,', expected: /blank/i },
      { features: 'process, delegate', expected: /whitespace/i },
      { features: 'process,delegate,delegate', expected: /duplicate.*delegate/i },
      { features: 'process,unknown', expected: /unknown.*accepted/i },
      { features: 'delegate', expected: /mandatory.*process/i },
      { features: 'process,bg_result', expected: /bg_result.*accepted/i },
      { features: 'PROCESS', expected: /PROCESS.*accepted/i },
      { features: 'process', shortcut: 'shift+up', expected: /PI_BG_DOCK_SHORTCUT.*accepted/i },
      { features: `process,${'x'.repeat(10_000)}`, expected: /pi_bg_config_invalid/i },
    ];
    for (const testCase of invalidCases) {
      configure(testCase.features, testCase.shortcut);
      const { result } = await loadPackage();
      assert.ok(result.errors.length >= 1, `expected load error for ${JSON.stringify(testCase)}`);
      const message = result.errors.map((error) => error.error).join('\n');
      assert.match(message, /pi_bg_config_invalid/);
      assert.match(message, testCase.expected);
      assert.ok(message.length < 8_000, `diagnostic should stay bounded, got ${String(message.length)}`);
      assert.doesNotMatch(message, /x{200}/, 'oversized invalid values must not be echoed');
      assert.deepEqual(inventory(result), {
        tools: [],
        commands: [],
        shortcuts: [],
        renderers: [],
      });
    }
  });

  void it('keeps ambient attribution off while the explicit child entry remains mandatory', async () => {
    configure('process', 'off');
    const ambient = await loadPackage({ paths: [ambientAttributionPath] });
    assert.deepEqual(ambient.result.errors, []);
    assert.deepEqual(inventory(ambient.result), {
      tools: [],
      commands: [],
      shortcuts: [],
      renderers: [],
    });
    assert.equal(ambient.result.runtime.pendingProviderRegistrations.length, 0);
    assert.equal(
      ambient.result.extensions.reduce(
        (count, extension) => count + [...extension.handlers.values()].flat().length,
        0,
      ),
      0,
    );

    const child = await loadPackage({ paths: [childAttributionPath] });
    assert.deepEqual(child.result.errors, []);
    assert.deepEqual(inventory(child.result).commands, ['claude-cache']);
    assert.equal(child.result.runtime.pendingProviderRegistrations.length, 1);
    assert.equal(child.result.runtime.pendingProviderRegistrations[0]?.name, 'anthropic');
    assert.ok(
      child.result.extensions.reduce(
        (count, extension) => count + [...extension.handlers.values()].flat().length,
        0,
      ) >= 3,
    );
  });

  void it('rebuilds exact registrations and active tools across a real AgentSession reload', async () => {
    configure(undefined, undefined);
    const { session } = await makeSession();
    try {
      assert.ok(session.getToolDefinition('fusion_reason'));
      assert.ok(session.getToolDefinition('bg_delegate'));
      assert.ok(session.getToolDefinition('bg_result'));
      assert.ok(session.getActiveToolNames().includes('fusion_reason'));
      assert.equal(session.extensionRunner.hasHandlers('session_tree'), true);
      const ambientProvider = session.extensionRunner
        .getModelRegistry()
        .getProvider('anthropic');
      assert.ok(ambientProvider);

      configure('process', 'off');
      await session.reload();
      assert.deepEqual(sessionInventory(session), expectedInventory(new Set(['process']), 'off'));
      for (const name of ADVANCED_TOOLS) {
        assert.equal(session.getToolDefinition(name), undefined, `${name} must be absent after reload`);
        assert.equal(session.getActiveToolNames().includes(name), false, `${name} must not stay active`);
      }
      assert.equal(session.extensionRunner.hasHandlers('session_tree'), false);
      const restoredProvider = session.extensionRunner
        .getModelRegistry()
        .getProvider('anthropic');
      assert.ok(restoredProvider);
      assert.notEqual(
        restoredProvider.streamSimple,
        ambientProvider.streamSimple,
        'reload must remove the package-owned ambient provider implementation',
      );

      configure('process,delegate', 'ctrl+alt+b');
      await session.reload();
      assert.deepEqual(
        sessionInventory(session),
        expectedInventory(new Set(['process', 'delegate']), 'ctrl+alt+b'),
      );
      assert.ok(session.getToolDefinition('bg_delegate'));
      assert.ok(session.getToolDefinition('bg_result'));
      assert.equal(session.getToolDefinition('fusion_reason'), undefined);
      assert.equal(
        session.extensionRunner
          .getRegisteredCommands()
          .some((command) => command.invocationName === 'claude-cache'),
        false,
      );
    } finally {
      await closeSession(session);
    }
  });

  void it('avoids the fixture Shift+Down conflict and dispatches both encoded keys to their owners', async () => {
    configure('process', 'ctrl+alt+b');
    const { session, eventBus } = await makeSession([shortcutOwnerPath]);
    const fixtureEvents: unknown[] = [];
    const unsubscribe = eventBus.on(
      'pi-bg-test:shortcut-owner:shift-down',
      (event) => fixtureEvents.push(event),
    );
    const customCalls = { value: 0 };
    const statuses: string[] = [];
    session.extensionRunner.setUIContext(
      uiWithDispatchCounters(
        session.extensionRunner.getUIContext(),
        customCalls,
        statuses,
      ),
    );
    try {
      const shortcuts = session.extensionRunner.getShortcuts({});
      assert.deepEqual(sorted(shortcuts.keys()), ['ctrl+alt+b', 'ctrl+alt+c', 'shift+down']);
      assert.equal(
        session.extensionRunner
          .getShortcutDiagnostics()
          .some((diagnostic) => /shortcut conflict/i.test(diagnostic.message)),
        false,
      );

      assert.equal(await dispatchEncodedKey(session.extensionRunner, '\u001b[1;2B'), 'shift+down');
      assert.equal(fixtureEvents.length, 1);
      assert.equal(customCalls.value, 0);

      assert.equal(await dispatchEncodedKey(session.extensionRunner, '\u001b\u0002'), 'ctrl+alt+b');
      assert.equal(customCalls.value, 1);
      assert.ok(statuses.some((status) => status.includes('focused')) || customCalls.value === 1);
    } finally {
      unsubscribe();
      await closeSession(session);
    }
  });

  void it('registers no dock shortcut in off mode while commands and fixture dispatch still work', async () => {
    configure('process', 'off');
    const { session, eventBus } = await makeSession([shortcutOwnerPath]);
    const fixtureEvents: unknown[] = [];
    const unsubscribe = eventBus.on(
      'pi-bg-test:shortcut-owner:shift-down',
      (event) => fixtureEvents.push(event),
    );
    const customCalls = { value: 0 };
    session.extensionRunner.setUIContext(
      uiWithDispatchCounters(session.extensionRunner.getUIContext(), customCalls, []),
    );
    try {
      const shortcuts = session.extensionRunner.getShortcuts({});
      assert.deepEqual(sorted(shortcuts.keys()), ['ctrl+alt+c', 'shift+down']);
      assert.equal(
        session.extensionRunner
          .getShortcutDiagnostics()
          .some((diagnostic) => /shortcut conflict/i.test(diagnostic.message)),
        false,
      );
      assert.equal(await dispatchEncodedKey(session.extensionRunner, '\u001b[1;2B'), 'shift+down');
      assert.equal(fixtureEvents.length, 1);
      assert.equal(await dispatchEncodedKey(session.extensionRunner, '\u001b\u0002'), undefined);

      for (const commandName of ['tasks', 'bg-tasks']) {
        const command = session.extensionRunner
          .getRegisteredCommands()
          .find((candidate) => candidate.invocationName === commandName);
        assert.ok(command, `/${commandName} must remain registered`);
        await command.handler('', session.extensionRunner.createCommandContext());
      }
      assert.equal(customCalls.value, 2);

      const response = new Promise<unknown>((resolve) => {
        const remove = eventBus.on(BG_RESPONSE_CHANNEL, (value) => {
          remove();
          resolve(value);
        });
      });
      eventBus.emit(BG_REQUEST_CHANNEL, {
        schema_version: BG_REQUEST_SCHEMA,
        request_id: 'process-only-capabilities',
        operation: 'capabilities',
        payload: {},
      });
      const event = await response;
      assert.ok(event && typeof event === 'object');
      assert.equal(Reflect.get(event, 'schema_version'), BG_RESPONSE_SCHEMA);
      assert.equal(Reflect.get(event, 'request_id'), 'process-only-capabilities');
      assert.equal(Reflect.get(event, 'ok'), true);
    } finally {
      unsubscribe();
      await closeSession(session);
    }
  });

  void it('derives the actual footer hint from default, alternate, and off shortcut config', async () => {
    for (const testCase of [
      { shortcut: undefined, expected: 'Shift↓' },
      { shortcut: 'ctrl+alt+b', expected: 'CtrlAltB' },
      { shortcut: 'off', expected: '/tasks' },
    ] as const) {
      configure('process', testCase.shortcut);
      const { session } = await makeSession();
      const statuses: string[] = [];
      session.extensionRunner.setUIContext(
        uiWithDispatchCounters(session.extensionRunner.getUIContext(), { value: 0 }, statuses),
      );
      try {
        const result = await executeTool(session, 'bg_run', {
          name: 'Feature footer',
          command: `node -e ${JSON.stringify('setTimeout(() => {}, 10000)')}`,
          isAgent: false,
          notifyOnCompletion: false,
          triggerOnCompletion: false,
        });
        assert.ok(result && typeof result === 'object');
        const jobs = session.extensionRunner
          .getRegisteredCommands()
          .find((command) => command.invocationName === 'jobs');
        assert.ok(jobs);
        await jobs.handler('', session.extensionRunner.createCommandContext());
        assert.ok(
          statuses.some((status) => status.includes(testCase.expected)),
          `footer should include ${testCase.expected}: ${statuses.join(' | ')}`,
        );
        const details = Reflect.get(result, 'details') as { task?: { id?: string } } | undefined;
        const taskId = details?.task?.id;
        assert.equal(typeof taskId, 'string');
        await executeTool(session, 'bg_kill', { taskId });
      } finally {
        await closeSession(session);
      }
    }
  });
});
