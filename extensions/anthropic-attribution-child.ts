// Always-on safety entrypoint for package-owned isolated Anthropic children.
// Ambient parent capability selection must never disable this extension.
export { default } from '../src/core/anthropic-attribution.js';
