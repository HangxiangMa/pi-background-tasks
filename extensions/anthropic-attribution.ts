import type { Provider } from '@earendil-works/pi-ai';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import spawnAnthropicAttribution, {
  type PiContextLike,
  type PiExtensionHost,
} from '../src/core/anthropic-attribution.js';
import { parseBackgroundTasksConfig } from '../src/core/config.js';

const ANTHROPIC_PROVIDER = 'anthropic';

type RegisteredProviderConfig = NonNullable<
  ReturnType<ModelRegistry['getRegisteredProviderConfig']>
>;

interface AmbientAttributionContext extends PiContextLike {
  readonly modelRegistry: ModelRegistry;
}

interface ProviderSnapshot {
  readonly effective: Provider;
  readonly legacy: RegisteredProviderConfig | undefined;
  readonly native: Provider | undefined;
}

interface ProviderInstallation {
  readonly registry: ModelRegistry;
  readonly before: ProviderSnapshot;
  readonly token: RegisteredProviderConfig;
}

function captureProviderSnapshot(registry: ModelRegistry): ProviderSnapshot {
  const effective = registry.getProvider(ANTHROPIC_PROVIDER);
  if (effective === undefined) {
    throw new Error(
      'pi_anthropic_attribution_unsupported: the host exposes no effective anthropic provider to preserve',
    );
  }
  return {
    effective,
    legacy: registry.getRegisteredProviderConfig(ANTHROPIC_PROVIDER),
    native: registry.getRegisteredNativeProvider(ANTHROPIC_PROVIDER),
  };
}

function confirmProviderInstallation(
  registry: ModelRegistry,
  before: ProviderSnapshot,
): ProviderInstallation | undefined {
  const token = registry.getRegisteredProviderConfig(ANTHROPIC_PROVIDER);
  const native = registry.getRegisteredNativeProvider(ANTHROPIC_PROVIDER);
  const effective = registry.getProvider(ANTHROPIC_PROVIDER);

  // The accepted duplicate-owner protocol returned without registering anything.
  if (token === before.legacy && native === before.native && effective === before.effective) {
    return undefined;
  }

  if (
    token === undefined ||
    token === before.legacy ||
    native !== undefined ||
    effective === undefined ||
    effective === before.effective ||
    token.streamSimple === before.legacy?.streamSimple
  ) {
    throw new Error(
      'pi_anthropic_attribution_install_failed: host provider registration did not install the package transport atomically',
    );
  }

  return { registry, before, token };
}

function sameConfigValues(
  left: RegisteredProviderConfig,
  right: RegisteredProviderConfig,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && Object.is(Reflect.get(left, key), Reflect.get(right, key)),
    )
  );
}

function restoreProviderInstallation(installation: ProviderInstallation): void {
  const { registry, before, token } = installation;
  if (
    registry.getRegisteredProviderConfig(ANTHROPIC_PROVIDER) !== token ||
    registry.getRegisteredNativeProvider(ANTHROPIC_PROVIDER) !== undefined
  ) {
    // A later owner replaced this exact installation. It owns teardown now.
    return;
  }

  if (before.native !== undefined) {
    registry.registerProvider(before.native);
  } else if (before.legacy !== undefined) {
    // Native replacement removes only the still-current package legacy layer. Reapplying
    // the prior legacy snapshot then starts from an empty legacy layer, so package-only
    // fields cannot leak through ModelRuntime's documented merge semantics.
    registry.registerProvider(before.effective);
    registry.registerProvider(ANTHROPIC_PROVIDER, before.legacy);
  } else {
    registry.registerProvider(before.effective);
  }

  const restoredConfig = registry.getRegisteredProviderConfig(ANTHROPIC_PROVIDER);
  const restoredNative = registry.getRegisteredNativeProvider(ANTHROPIC_PROVIDER);
  const restoredEffective = registry.getProvider(ANTHROPIC_PROVIDER);
  const registrationRestored =
    before.legacy !== undefined
      ? restoredNative === undefined &&
        restoredConfig !== undefined &&
        sameConfigValues(restoredConfig, before.legacy)
      : restoredConfig === undefined && restoredNative === (before.native ?? before.effective);
  const streamIdentityRestored =
    before.legacy !== undefined
      ? restoredConfig?.streamSimple === before.legacy.streamSimple
      : restoredEffective?.streamSimple === before.effective.streamSimple;
  if (!registrationRestored || restoredEffective === undefined || !streamIdentityRestored) {
    throw new Error(
      'pi_anthropic_attribution_restore_failed: the preexisting host provider was not restored by identity',
    );
  }
}

export default function ambientAnthropicAttribution(pi: PiExtensionHost): void {
  const config = parseBackgroundTasksConfig();
  if (config.features.attribution) {
    let installation: ProviderInstallation | undefined;
    pi.on('session_start', (_event, context) => {
      const registry = (context as AmbientAttributionContext).modelRegistry;
      const before = captureProviderSnapshot(registry);
      spawnAnthropicAttribution(pi);
      installation = confirmProviderInstallation(registry, before) ?? installation;
    });
    pi.on('session_shutdown', () => {
      const current = installation;
      installation = undefined;
      if (current !== undefined) restoreProviderInstallation(current);
    });
  }
}
