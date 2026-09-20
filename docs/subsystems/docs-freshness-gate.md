---
doc_id: subsystems/docs-freshness-gate
audience: maintainer
mode: mixed
review_policy: contract
stability: stable
covers_surfaces: []
covers_sources: []
---
# Docs freshness gate

This authored section defines the boundary: documentation facts are extracted from package metadata and TypeScript ASTs, then generated into docs and the manifest. Unsupported syntax fails the gate rather than falling back to regex or stale hand-maintained inventories. Public registrations must remain unconditional top-level direct calls, use the one validated local tool-wrapper shape, use the closed finite-variant grammar below, or occur in a direct inline `session_start` activation callback whose containing statement already has validated availability. Host/method aliases, computed access, nested/dynamic conditions, loops, wrapper chaining/passing, constructor helpers, ambiguous public metadata, destructured Pi parameters, and repeated imported registrars are rejected.

The finite grammar recognizes only a top-level immutable binding returned by the imported `parseBackgroundTasksConfig()` and direct top-level registration/registrar calls guarded by a validated feature atom, the exact delegate-or-Fusion derived-result disjunction, or one of the two registrable dock literals. The parser itself must have the reviewed structural shape: it freezes the returned config and freezes the exact feature record. Every config-binding use is checked; aliases, writes, updates, mutation calls, argument escapes, and unsupported conditions fail. `off` cannot guard a registration. Runtime feature/shortcut/default enums are compared with the docs engine's closed enum, so drift fails generation.

Every registration-owning function, imported registrar, and supported activation callback is checked as a whole, including parameter initializers. Default-parameter host aliases, registration methods on unknown hosts, and unmodeled early returns or throws are rejected. The sole early-return form is the structurally validated synchronous EventBus duplicate-owner claim guard: one local acknowledgement array, one direct claim emit with an acknowledgement callback, and the exact positive-length bare return. Returns inside command/tool/event handlers that own no registrations remain unrelated and legal. Extracted surfaces carry a normalized availability expression and source-derived default status through the manifest, INDEX/read gate, README facts, and generated surface contracts.

<!-- pi-docs:begin name="docs-freshness-gate" generator="scripts/docs/generate.mjs" -->
- Canonical package version: `2.5.0`
- Governed markdown docs: 42
- Public surfaces extracted: 32
- Public surfaces available by default: 31
- Finite feature values: `process`, `delegate`, `fusion`, `attested`, `attribution`
- Finite dock shortcut values: `shift+down`, `ctrl+alt+b`, `off`
- Governed production sources: 52
- Tool contracts extracted: 11
- Schema IDs extracted: 46
- Environment variable references extracted: 52
- Behavioral attestation receipts not passing: 8
- Receipt store: `docs/attestations.json`

`npm run docs:verify` is read-only: it renders generated files twice in memory and compares them with committed bytes. `npm run docs:generate` is the only docs writer.
<!-- pi-docs:end name="docs-freshness-gate" -->
