import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it, type TestContext } from 'node:test';
import {
  streamAnthropicViaBetaMessages,
  type PiStreamContext,
} from '../../src/core/anthropic-attribution.js';
import { isJsonObject, type JsonObject } from '../../src/core/common.js';

const minimaxModel = {
  id: 'MiniMax-M3',
  name: 'MiniMax M3',
  api: 'anthropic-messages',
  provider: 'minimax',
  baseUrl: 'https://minimax.example',
  reasoning: false,
  input: ['text'],
  cost: { input: 1, output: 2, cacheRead: 0.1, cacheWrite: 1.25 },
  contextWindow: 200_000,
  maxTokens: 8192,
} as const;

const minimaxContext: PiStreamContext = {
  systemPrompt: 'Non-target system prompt.',
  messages: [
    { role: 'user', content: 'Forward without Anthropic attribution.', timestamp: 1 },
  ],
};

function successfulSse(): Response {
  const events: JsonObject[] = [
    {
      type: 'message_start',
      message: {
        id: 'minimax-response-1',
        type: 'message',
        role: 'assistant',
        model: 'MiniMax-M3',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 3, output_tokens: 0 },
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'forwarded' } },
    { type: 'content_block_stop', index: 0 },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 1 },
    },
    { type: 'message_stop' },
  ];
  return new Response(
    events.map((event) => `event: ${String(event['type'])}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );
}

void describe('non-target anthropic-messages forwarding (#19)', () => {
  void it('uses only the exported host SDK adapter surface', async () => {
    const source = await readFile('src/core/anthropic-attribution.ts', 'utf8');
    assert.match(source, /from '@earendil-works\/pi-ai\/compat'/u);
    assert.match(source, /anthropicMessagesApi\(\)\.streamSimple/u);
    assert.doesNotMatch(source, /new Function/u);
    assert.doesNotMatch(source, /@earendil-works\/pi-ai\/anthropic/u);
  });

  void it('uses the supported host adapter once without target-only rewriting', async (t: TestContext) => {
    let calls = 0;
    let requestUrl = '';
    let requestHeaders = new Headers();
    let requestPayload: JsonObject | undefined;
    let middlewareCalls = 0;
    let responseCalls = 0;
    t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
      calls += 1;
      requestUrl = input instanceof Request ? input.url : String(input);
      requestHeaders = new Headers(init?.headers);
      const body = init?.body;
      if (typeof body !== 'string') throw new TypeError('forwarded request body must be a string');
      const parsed: unknown = JSON.parse(body);
      assert.ok(isJsonObject(parsed));
      requestPayload = parsed;
      return successfulSse();
    });

    const result = await streamAnthropicViaBetaMessages(
      minimaxModel,
      minimaxContext,
      {
        apiKey: 'minimax-test-key',
        sessionId: 'non-target-session',
        cacheRetention: 'none',
        headers: { 'x-minimax-route': 'route-a' },
        onPayload(payload, forwardedModel) {
          middlewareCalls += 1;
          assert.equal(forwardedModel.provider, 'minimax');
          return payload;
        },
        onResponse(response, forwardedModel) {
          responseCalls += 1;
          assert.equal(response.status, 200);
          assert.equal(forwardedModel.provider, 'minimax');
        },
      },
    ).result();

    assert.equal(result.stopReason, 'stop', result.errorMessage);
    assert.equal(result.provider, 'minimax');
    assert.equal(result.api, 'anthropic-messages');
    assert.equal(result.model, 'MiniMax-M3');
    assert.deepEqual(result.content, [{ type: 'text', text: 'forwarded' }]);
    assert.equal(calls, 1);
    assert.equal(middlewareCalls, 1);
    assert.equal(responseCalls, 1);
    assert.match(requestUrl, /^https:\/\/minimax\.example\/v1\/messages/u);
    assert.equal(requestHeaders.get('x-api-key'), 'minimax-test-key');
    assert.equal(requestHeaders.get('x-minimax-route'), 'route-a');
    assert.ok(requestPayload);
    assert.equal(requestPayload['model'], 'MiniMax-M3');
    assert.equal(JSON.stringify(requestPayload).includes('x-anthropic-billing-header'), false);
    assert.equal(requestPayload['metadata'], undefined);
    assert.equal(requestHeaders.get('X-Claude-Code-Session-Id'), null);
  });
});
