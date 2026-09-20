import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  DefaultResourceLoader,
  SettingsManager,
} from '/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js';
import {
  Type,
  normalizeContext,
  type AssistantMessage,
  type Model,
} from '/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/index.js';

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const models: Array<Model<'anthropic-messages'>> = [
  {
    id: 'MiniMax-M3',
    name: 'MiniMax M3',
    api: 'anthropic-messages',
    provider: 'minimax',
    baseUrl: 'https://minimax.pi086.example',
    reasoning: false,
    input: ['text'],
    cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 },
    contextWindow: 200_000,
    maxTokens: 8192,
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    api: 'anthropic-messages',
    provider: 'kimi-coding',
    baseUrl: 'https://kimi.pi086.example',
    reasoning: true,
    input: ['text'],
    cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 },
    contextWindow: 262_144,
    maxTokens: 32_768,
    compat: {
      forceAdaptiveThinking: true,
      supportsMidConvoEffort: true,
    },
  },
];

function response(id: string, model: string): Response {
  const events = [
    {
      type: 'message_start',
      message: {
        id,
        type: 'message',
        role: 'assistant',
        model,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 3, output_tokens: 0 },
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: `forwarded-${model}` } },
    { type: 'content_block_stop', index: 0 },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 2, output_tokens_details: { thinking_tokens: 1 } },
    },
    { type: 'message_stop' },
  ];
  return new Response(
    events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );
}

const agentDir = process.env['PI_CODING_AGENT_DIR'];
if (!agentDir) throw new Error('PI_CODING_AGENT_DIR is required for the isolated fixture');
const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
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
const registration = loaded.runtime.pendingProviderRegistrations.find(
  (candidate) => candidate.name === 'anthropic',
);
assert.ok(registration);
const transport = registration.config.streamSimple;
assert.equal(typeof transport, 'function');
if (!transport) throw new TypeError('installed Pi 0.86 provider registration lacks streamSimple');

interface CapturedRequest {
  readonly url: string;
  readonly headers: Headers;
  readonly payload: JsonObject;
}

const requests: CapturedRequest[] = [];
globalThis.fetch = async (input, init) => {
  const body = init?.body;
  if (typeof body !== 'string') throw new TypeError('forwarded request body must be a string');
  const parsed: unknown = JSON.parse(body);
  if (!isJsonObject(parsed)) throw new TypeError('forwarded request payload must be an object');
  const model = String(Reflect.get(parsed, 'model'));
  requests.push({
    url: input instanceof Request ? input.url : String(input),
    headers: new Headers(init?.headers),
    payload: parsed,
  });
  return response(`pi086-${String(requests.length)}`, model);
};

const callbackProviders: string[] = [];
const results: AssistantMessage[] = [];
for (const model of models) {
  const context = normalizeContext({
    systemPrompt: `Pi 0.86 normalized system for ${model.provider}`,
    tools: [
      {
        name: 'inspect_state',
        description: 'Inspect normalized tool state',
        parameters: Type.Object({ path: Type.String() }),
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Forward ${model.provider} through the matching host adapter.`,
        timestamp: 2,
      },
    ],
  });
  const leading = context.messages[0];
  assert.ok(leading && leading.role === 'system');
  assert.equal(leading.toolsAdded?.[0]?.name, 'inspect_state');
  const result = await transport(model, context, {
    apiKey: `${model.provider}-offline-key`,
    cacheRetention: 'none',
    ...(model.reasoning ? { reasoning: 'high' } : {}),
    headers: { 'x-route-owner': model.provider },
    onPayload(payload, callbackModel) {
      assert.strictEqual(callbackModel, model);
      callbackProviders.push(`payload:${callbackModel.provider}`);
      return payload;
    },
    onResponse(responseValue, callbackModel) {
      assert.equal(responseValue.status, 200);
      assert.strictEqual(callbackModel, model);
      callbackProviders.push(`response:${callbackModel.provider}`);
    },
  }).result();
  assert.equal(result.stopReason, 'stop', result.errorMessage);
  assert.equal(result.provider, model.provider);
  assert.equal(result.model, model.id);
  assert.equal(Reflect.get(result.usage, 'reasoning'), 1);
  results.push(result);
}

assert.equal(requests.length, 2);
for (const [index, request] of requests.entries()) {
  const model = models[index];
  assert.ok(model);
  assert.match(request.url, new RegExp(`^https://${model.provider === 'minimax' ? 'minimax' : 'kimi'}\\.pi086\\.example/`, 'u'));
  assert.equal(request.headers.get('x-api-key'), `${model.provider}-offline-key`);
  assert.equal(request.headers.get('x-route-owner'), model.provider);
  assert.equal(request.headers.get('X-Claude-Code-Session-Id'), null);
  assert.equal(JSON.stringify(request.payload).includes('x-anthropic-billing-header'), false);
  assert.equal(Reflect.get(request.payload, 'metadata'), undefined);
  assert.equal(JSON.stringify(Reflect.get(request.payload, 'system')).includes(`Pi 0.86 normalized system for ${model.provider}`), true);
  assert.equal(JSON.stringify(Reflect.get(request.payload, 'tools')).includes('inspect_state'), true);
}
assert.deepEqual(callbackProviders, [
  'payload:minimax',
  'response:minimax',
  'payload:kimi-coding',
  'response:kimi-coding',
]);
const kimiResult = results[1];
assert.ok(kimiResult);
assert.equal(kimiResult.providerThinkingLevel, 'high');
loaded.runtime.invalidate('installed Pi 0.86 forwarding fixture complete');
process.stdout.write(`${JSON.stringify({
  ok: true,
  hostPiVersion: '0.86.0',
  loader: 'DefaultResourceLoader',
  providers: results.map((result) => result.provider),
  fetchCalls: requests.length,
  normalizedSystemAndTools: true,
  reasoningUsage: results.map((result) => Reflect.get(result.usage, 'reasoning')),
  kimiProviderThinkingLevel: kimiResult.providerThinkingLevel,
})}\n`);
