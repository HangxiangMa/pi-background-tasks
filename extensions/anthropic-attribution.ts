import spawnAnthropicAttribution, {
  ANTHROPIC_ATTRIBUTION_CLAIM_CHANNEL,
  type PiExtensionHost,
} from '../src/core/anthropic-attribution.js';
import { parseBackgroundTasksConfig } from '../src/core/config.js';

interface AmbientAttributionHost extends PiExtensionHost {
  unregisterProvider(name: string): void;
}

const ANTHROPIC_ATTRIBUTION_CLAIM_SCHEMA = 'pi-anthropic-attribution.claim.v1';

export default function ambientAnthropicAttribution(pi: AmbientAttributionHost): void {
  const config = parseBackgroundTasksConfig();
  if (config.features.attribution) {
    let existingOwner = false;
    pi.events.emit(ANTHROPIC_ATTRIBUTION_CLAIM_CHANNEL, {
      schema_version: ANTHROPIC_ATTRIBUTION_CLAIM_SCHEMA,
      acknowledge: () => {
        existingOwner = true;
      },
    });
    spawnAnthropicAttribution(pi);
    pi.on('session_shutdown', () => {
      if (!existingOwner) pi.unregisterProvider('anthropic');
    });
  }
}
