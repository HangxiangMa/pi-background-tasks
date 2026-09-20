import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  DefaultResourceLoader,
  SettingsManager,
} from '@earendil-works/pi-coding-agent';

const events = [
  {
    type: 'message_start',
    message: {
      id: 'compiled-forward-response',
      type: 'message',
      role: 'assistant',
      model: 'MiniMax-M3',
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 2, output_tokens: 0 },
    },
  },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'compiled-ok' } },
  { type: 'content_block_stop', index: 0 },
  {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: 1 },
  },
  { type: 'message_stop' },
];

const cwd = process.cwd();
const agentDir = process.env['PI_CODING_AGENT_DIR'] ?? resolve('.pi-agent-fixture');
const loader = new DefaultResourceLoader({
  cwd,
  agentDir,
  settingsManager: SettingsManager.inMemory(),
  additionalExtensionPaths: [resolve('extensions/anthropic-attribution.ts')],
  noExtensions: true,
  noSkills: true,
  noPromptTemplates: true,
  noContextFiles: true,
  noThemes: true,
});
await loader.reload();
const loaded = loader.getExtensions();
assert.deepEqual(loaded.errors, []);
assert.ok(
  loaded.extensions.some((extension) => extension.commands.has('claude-cache')),
  'compiled Pi loader should execute the attribution factory',
);
const registration = loaded.runtime.pendingProviderRegistrations.find(
  (candidate) => candidate.name === 'anthropic',
);
assert.ok(registration);
const transport = registration.config.streamSimple;
assert.equal(typeof transport, 'function');

let fetchCalls = 0;
let observedUrl = '';
let observedProvider = '';
globalThis.fetch = async (input, init) => {
  fetchCalls += 1;
  observedUrl = input instanceof Request ? input.url : String(input);
  assert.equal(new Headers(init?.headers).get('x-api-key'), 'compiled-minimax-key');
  const body = init?.body;
  if (typeof body !== 'string') throw new TypeError('compiled request body must be a string');
  const payload: unknown = JSON.parse(body);
  assert.ok(typeof payload === 'object' && payload !== null && !Array.isArray(payload));
  assert.equal(Reflect.get(payload, 'model'), 'MiniMax-M3');
  assert.equal(JSON.stringify(payload).includes('x-anthropic-billing-header'), false);
  return new Response(
    events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );
};

if (!transport) throw new TypeError('attribution provider registration is missing streamSimple');
const result = await transport(
  {
    id: 'MiniMax-M3',
    name: 'MiniMax M3',
    api: 'anthropic-messages',
    provider: 'minimax',
    baseUrl: 'https://compiled-minimax.example',
    reasoning: false,
    input: ['text'],
    cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 },
    contextWindow: 200_000,
    maxTokens: 8192,
  },
  {
    systemPrompt: 'Compiled forwarding fixture.',
    messages: [{ role: 'user', content: 'Respond through the mock.', timestamp: 1 }],
  },
  {
    apiKey: 'compiled-minimax-key',
    sessionId: 'compiled-non-target-session',
    cacheRetention: 'none',
    onPayload(payload, model) {
      observedProvider = model.provider;
      return payload;
    },
  },
).result();

assert.equal(result.stopReason, 'stop', result.errorMessage);
assert.equal(result.provider, 'minimax');
assert.deepEqual(result.content, [{ type: 'text', text: 'compiled-ok' }]);
assert.equal(fetchCalls, 1);
assert.equal(observedProvider, 'minimax');
assert.match(observedUrl, /^https:\/\/compiled-minimax\.example\/v1\/messages/u);
loaded.runtime.invalidate('compiled loader fixture complete');
process.stdout.write(
  `${JSON.stringify({ ok: true, loader: 'DefaultResourceLoader', fetchCalls, provider: result.provider })}\n`,
);
