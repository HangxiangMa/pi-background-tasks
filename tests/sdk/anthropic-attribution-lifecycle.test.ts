import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import type { Model } from '@earendil-works/pi-ai';
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
  type AgentSession,
  type InlineExtension,
} from '@earendil-works/pi-coding-agent';
import { isJsonObject, type JsonObject } from '../../src/core/common.js';

const extensionPath = resolve('extensions/anthropic-attribution.ts');
const lifecycleModel: Model<'anthropic-messages'> = {
  id: 'claude-fable-5-1',
  name: 'Claude Fable 5.1 lifecycle fixture',
  api: 'anthropic-messages',
  provider: 'anthropic',
  baseUrl: 'https://api.anthropic.com',
  reasoning: true,
  input: ['text'],
  cost: { input: 1, output: 1, cacheRead: 0.1, cacheWrite: 1.25 },
  contextWindow: 200_000,
  maxTokens: 128_000,
  compat: { supportsLongCacheRetention: true, supportsCacheControlOnTools: true },
};

function response(id: string): Response {
  const events: JsonObject[] = [
    { type: 'message_start', message: { id, usage: { input_tokens: 1 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: `Visible thought ${id}` } },
    { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: `signature-${id}` } },
    { type: 'content_block_stop', index: 0 },
    { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: `Answer ${id}` } },
    { type: 'content_block_stop', index: 1 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 2 } },
    { type: 'message_stop' },
  ];
  return new Response(
    events.map((event) => `event: ${String(event['type'])}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );
}

function assistant(session: AgentSession) {
  const message = session.messages.at(-1);
  assert.ok(message && message.role === 'assistant');
  return message;
}

function previousId(payload: JsonObject | undefined): unknown {
  assert.ok(
    payload && isJsonObject(payload['diagnostics']),
    `payload should include cache diagnostics: ${JSON.stringify(payload)}`,
  );
  return payload['diagnostics']['previous_message_id'];
}

function signedValues(payload: JsonObject | undefined): string[] {
  assert.ok(payload && Array.isArray(payload['messages']));
  const values: string[] = [];
  for (const message of payload['messages']) {
    if (!isJsonObject(message) || !Array.isArray(message['content'])) continue;
    for (const block of message['content']) {
      if (!isJsonObject(block)) continue;
      if (block['type'] === 'thinking' && typeof block['signature'] === 'string')
        values.push(block['signature']);
      if (block['type'] === 'redacted_thinking' && typeof block['data'] === 'string')
        values.push(block['data']);
    }
  }
  return values;
}

function payloadText(payload: JsonObject | undefined): string {
  return JSON.stringify(payload);
}

async function removeFirstPersistedThinking(sessionFile: string): Promise<void> {
  const source = await readFile(sessionFile, 'utf8');
  let removed = false;
  const rewritten = source
    .trimEnd()
    .split('\n')
    .map((line) => {
      const parsed: unknown = JSON.parse(line);
      if (!removed && isJsonObject(parsed) && parsed['type'] === 'message') {
        const message = parsed['message'];
        if (isJsonObject(message) && message['role'] === 'assistant' && Array.isArray(message['content'])) {
          const nextContent = message['content'].filter(
            (block) => !isJsonObject(block) || block['type'] !== 'thinking',
          );
          if (nextContent.length !== message['content'].length) {
            removed = true;
            return JSON.stringify({ ...parsed, message: { ...message, content: nextContent } });
          }
        }
      }
      return JSON.stringify(parsed);
    });
  assert.equal(removed, true, 'fixture should remove one persisted thinking block');
  await writeFile(sessionFile, `${rewritten.join('\n')}\n`, 'utf8');
}

void describe('Anthropic attribution through Pi reload and resume (#14)', () => {
  void it('reconstructs a drifted JSONL session, reanchors once, and chains the next turn', async (t: TestContext) => {
    const root = await mkdtemp(join(tmpdir(), 'pi-bg-attribution-lifecycle-'));
    const cwd = join(root, 'project');
    const agentDir = join(root, 'agent');
    const sessionDir = join(root, 'sessions');
    const home = join(root, 'home');
    await Promise.all([
      mkdir(cwd, { recursive: true }),
      mkdir(agentDir, { recursive: true }),
      mkdir(sessionDir, { recursive: true }),
      mkdir(home, { recursive: true }),
    ]);
    await writeFile(
      join(home, '.claude.json'),
      `${JSON.stringify({ userID: 'lifecycle-device', oauthAccount: { accountUuid: 'lifecycle-account' } })}\n`,
      'utf8',
    );

    const priorHome = process.env['HOME'];
    process.env['HOME'] = home;
    const lifecycleEvents: string[] = [];
    const observer: InlineExtension = {
      name: 'attribution-lifecycle-observer',
      factory: (pi) => {
        pi.on('session_start', (event) => {
          lifecycleEvents.push(`start:${event.reason}`);
        });
        pi.on('session_shutdown', (event) => {
          lifecycleEvents.push(`shutdown:${event.reason}`);
        });
      },
    };
    const payloads: JsonObject[] = [];
    let requestOrdinal = 0;
    t.mock.method(globalThis, 'fetch', async (_input: string | URL | Request, init?: RequestInit) => {
      const body = init?.body;
      if (typeof body !== 'string') throw new TypeError('lifecycle request body must be a string');
      const parsed: unknown = JSON.parse(body);
      assert.ok(isJsonObject(parsed));
      payloads.push(parsed);
      requestOrdinal += 1;
      return response(`msg_lifecycle_${String(requestOrdinal)}`);
    });

    const makeRuntime = async () => {
      const settingsManager = SettingsManager.inMemory({
        compaction: { enabled: false },
        retry: { enabled: false },
      });
      const loader = new DefaultResourceLoader({
        cwd,
        agentDir,
        settingsManager,
        additionalExtensionPaths: [extensionPath],
        extensionFactories: [observer],
        noExtensions: true,
        noSkills: true,
        noPromptTemplates: true,
        noContextFiles: true,
        noThemes: true,
      });
      await loader.reload();
      const modelRuntime = await ModelRuntime.create({
        authPath: join(agentDir, 'auth.json'),
        modelsPath: null,
      });
      await modelRuntime.setRuntimeApiKey('anthropic', 'sk-ant-oat-lifecycle-test');
      return { settingsManager, loader, modelRuntime };
    };

    let firstSession: AgentSession | undefined;
    let resumedSession: AgentSession | undefined;
    try {
      const firstRuntime = await makeRuntime();
      const created = await createAgentSession({
        cwd,
        agentDir,
        model: lifecycleModel,
        thinkingLevel: 'high',
        resourceLoader: firstRuntime.loader,
        modelRuntime: firstRuntime.modelRuntime,
        settingsManager: firstRuntime.settingsManager,
        sessionManager: SessionManager.create(cwd, sessionDir),
        noTools: 'all',
      });
      assert.deepEqual(created.extensionsResult.errors, []);
      firstSession = created.session;
      await firstSession.bindExtensions({ onError: (error) => assert.fail(error.error) });
      assert.ok(
        firstSession.extensionRunner
          .getRegisteredCommands()
          .some((command) => command.invocationName === 'claude-cache'),
        `attribution command should be registered before reload: ${firstSession.extensionRunner
          .getRegisteredCommands()
          .map((command) => command.invocationName)
          .join(',')}`,
      );
      await firstSession.prompt('Start the lifecycle fixture.');
      assert.equal(assistant(firstSession).stopReason, 'stop');

      await firstSession.reload();
      assert.ok(
        firstSession.extensionRunner
          .getRegisteredCommands()
          .some((command) => command.invocationName === 'claude-cache'),
        `attribution command should be registered after reload: ${firstSession.extensionRunner
          .getRegisteredCommands()
          .map((command) => command.invocationName)
          .join(',')}`,
      );
      await firstSession.prompt('Continue after the real SDK reload.');
      assert.equal(assistant(firstSession).stopReason, 'stop');
      assert.equal(previousId(payloads[1]), 'msg_lifecycle_1');
      assert.ok(lifecycleEvents.includes('shutdown:reload'));
      assert.ok(lifecycleEvents.includes('start:reload'));

      const sessionFile = firstSession.sessionFile;
      assert.ok(sessionFile);
      await firstSession.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
      firstSession.dispose();
      firstSession = undefined;

      await removeFirstPersistedThinking(sessionFile);
      const resumedManager = SessionManager.open(sessionFile, sessionDir, cwd);
      const reconstructed = resumedManager.buildSessionContext();
      assert.ok(
        reconstructed.messages.some(
          (message) => message.role === 'assistant' && message.content.some((block) => block.type === 'thinking'),
        ),
        'later thinking should remain after the persisted-history reconstruction fixture',
      );

      const resumedRuntime = await makeRuntime();
      const resumed = await createAgentSession({
        cwd,
        agentDir,
        model: lifecycleModel,
        thinkingLevel: 'high',
        resourceLoader: resumedRuntime.loader,
        modelRuntime: resumedRuntime.modelRuntime,
        settingsManager: resumedRuntime.settingsManager,
        sessionManager: resumedManager,
        sessionStartEvent: {
          type: 'session_start',
          reason: 'resume',
          previousSessionFile: sessionFile,
        },
        noTools: 'all',
      });
      resumedSession = resumed.session;
      await resumedSession.bindExtensions({ onError: (error) => assert.fail(error.error) });
      assert.ok(lifecycleEvents.includes('start:resume'));

      await resumedSession.prompt('Continue from reconstructed history.');
      const recovered = assistant(resumedSession);
      assert.equal(recovered.stopReason, 'stop', recovered.errorMessage);
      assert.equal(previousId(payloads[2]), null);
      assert.deepEqual(signedValues(payloads[2]), []);
      assert.match(payloadText(payloads[2]), /Visible thought msg_lifecycle_2/u);

      await resumedSession.prompt('Chain after the recovered turn.');
      assert.equal(assistant(resumedSession).stopReason, 'stop');
      assert.equal(previousId(payloads[3]), 'msg_lifecycle_3');
      assert.deepEqual(signedValues(payloads[3]), ['signature-msg_lifecycle_3']);
      assert.equal(payloads.length, 4);
    } finally {
      if (firstSession) {
        await firstSession.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
        firstSession.dispose();
      }
      if (resumedSession) {
        await resumedSession.extensionRunner.emit({ type: 'session_shutdown', reason: 'quit' });
        resumedSession.dispose();
      }
      if (priorHome === undefined) Reflect.deleteProperty(process.env, 'HOME');
      else process.env['HOME'] = priorHome;
      await rm(root, { recursive: true, force: true });
    }
  });
});
