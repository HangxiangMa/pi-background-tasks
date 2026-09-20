# Live execution state

Last updated: 2026-09-20. Update this file at meaningful integration/checkpoint boundaries, not every tool call.

## Current stage

**IN_PROGRESS — authorized autonomous implementation, baseline and first lanes.**

Live package start: `14afc33e3967a142758169d3217a4e63b4b3ec94` (clean). Reverified all frozen hashes and deterministic docs gate. Scratch root: `/private/tmp/pi-bg-closeout-iNoltL` (2 GiB budget). Host: macOS arm64, Node 24.16.0, Pi 0.86.0, Bun 1.3.4; no native Windows/Nushell/pwsh/pnpm executable discovered.

Worker route bootstrap through installed Pi `ModelRuntime`: exact `openai-codex/gpt-5.6-sol`, `openai-codex-responses`, stored OAuth, `thinkingLevelMap.max = max`, official `https://chatgpt.com` origin. No model calls in bootstrap; each worker must verify its effective `PI_REASONING_LEVEL=max` before substantive work. Secret-free receipt is in scratch `reports/route-bootstrap.json` and will be retained with execution evidence.

- Package: `pi-background-tasks`, version 2.5.0.
- Frozen production HEAD: `14aa4ef382952f073bd4d540f57d6e8e3c2789a2`.
- This preparation adds only the `maintenance/community-closeout-2026-09/` dossier. Find its local preparation commit with `git log -1 -- maintenance/community-closeout-2026-09`; do not mistake its new HEAD for new production fixes.
- No GitHub interaction or pushes occurred during preparation. No changes to the parent repository or package runtime/tests/config were made.
- Snapshot and six PR diffs are durable here; resumption must not depend on `/tmp` artifacts or old conversation/tool output.
- Frozen evidence hash verification: all 49 covered files passed at preparation.
- Package-only worktree smoke: passed and cleaned. See `BASELINE.md` and `evidence/environment.json`.

## Work units

| Unit | Scope | State | Required next evidence |
|---|---|---|---|
| B0 | Trustworthy type-safety, file-URL, offline install gates; Windows SDK fixtures | IMPLEMENTED_UNVERIFIED (test repair); Windows fixture moves to L1 | `c0ba665`: package file24/24, docs5/5, typecheck pass; actual attribution double assertion intentionally red; independent review next |
| A1 | #14/#17 and #12 attribution recovery/coverage | IN_PROGRESS (attribution worker) | Recorded reset semantics, real lifecycle red/green, inherited safety tests |
| A2 | #13 config path; #19 non-target transport loading | IN_PROGRESS (attribution worker) | Config precedence decision; actual Node/compiled-loader proof |
| R1 | #24/#25 terminal delivery/disposal | IMPLEMENTED_UNVERIFIED (independent Sol review running) | Worker commit `a54bb8e`; registry/EventBus 40/40, SDK43/43, typecheck pass; shared generated docs pending |
| L1 | #9/#23 child executable resolution + Windows fake-child fixtures | IN_PROGRESS (mission launch next) | Unified platform policy; installed-layout/argv/identity qualification |
| C1 | #20 feature selection, #16 shortcut, #15 docs, #11 shell | PENDING (Sol design received) | `execution/feature-design.md`: strict feature/dependency set, finite shortcut variants, inherited/default shell plus explicit selection/guidance |
| P1 | #21/#22 startup performance | PENDING (Sol design received) | Same surface owner as C1; single-flight late-loading with lifecycle guards and measured distributions |
| D1 | #6 opt-in reload survival | PENDING (Sol design received) | Real Pi shutdown reason distinguishes reload; living same-process execution handoff, never PID/file adoption |
| D2 | #18 opt-in auto-background Bash | BLOCKED_DECISION (host capability under independent challenge) | Design finds no supported effective Bash execution/cancellation transfer API in Pi0.84/0.86; second Sol reviewer checking alternatives |
| Q0 | Integrated gates, independent review, compatibility and cleanup | PENDING | Integrated source-bound receipts; zero owned residue |

Issue/PR closure vocabulary and acceptance requirements are in `EXECUTION.md` and `ACCEPTANCE.md`. No row is currently CLOSURE_READY.

## Bootstrap after compaction

1. Read the mandatory gateway/docs and this dossier; verify evidence hashes; inspect clean package state and post-prep commits.
2. Inspect installed Pi docs and prove availability of the requested Sol 5.6/max/Codex-subscription launch without exposing credentials. CLI support for `--thinking max` is known; route/auth is not yet verified. Do not substitute another route if unavailable.
3. Record native Windows and compiled Bun test capability. No platform access, remote spending, or large VM download is pre-approved by this dossier.
4. Create a task-owned scratch root and a narrow unit mission. Record owner/path/branch/task below before launch. Begin B0 and red reproductions; parallelize only disjoint package files with at most two auxiliary worktrees.
5. For C1/D1/D2, turn the compatibility/opt-in policy into concrete executable acceptance scenarios before implementing. Do not silently shrink the request or invent a user approval for breaking defaults.
6. Integrate, verify, review, and clean per protocol; keep working until every row is closure-ready or has a concrete unavoidable blocker.

## Owned workspace ledger

Current ownership: integrator owns the main checkout; two auxiliary package-only worktrees are reserved below. No additional worktree may be created until one is removed.

Add rows only for resources created by this programme:

| Unit | Realpath | Branch/base | Task/PID | Ownership | Integration proof | Cleanup |
|---|---|---|---|---|---|---|
| baseline proof | `/tmp/pi-bg-wt-proof-s7ntno/package-only` | detached `14aa4ef` | no agent | package-only worktree | no modifications | removed normally; parent temp dir removed; prune dry-run empty |
| A1+A2 | `/private/tmp/pi-bg-closeout-iNoltL/attribution` | `closeout/attribution` @ `14afc33` | `be6b07f7d` / PID 73688 | attribution source/tests/docs only | pending | active; package boundary verified; read-only dependency symlink |
| R1 | `/private/tmp/pi-bg-closeout-iNoltL/delivery` | `closeout/delivery` @ `a54bb8e` | implementation `be8a687da` completed; independent review `b2cec576a` / PID 87427 | source frozen during independent review | local commit `a54bb8eeae39c02382fc0f5f3838180589701bc7`; integration pending | reviewer active; worker reports zero owned test processes; dependency symlink retained |
| B0 | primary package checkout (existing, not auxiliary) | `main` @ `c0ba665` | implementation complete; independent review `bac11380a` / PID89276 | frozen seven B0 paths only | committed `c0ba66543c67a468a67a859b7ff2d267d48b2e26`; report retained | review active; no checkout removal |
| L1 | primary package checkout (existing, not auxiliary) | starts after maintenance checkpoint | launch pending | pi-launch source, launcher tests/fake child fixtures, owning launch docs; no B0/shared QA paths | pending | reserved; no checkout removal |
| C1/P1/D1/D2 design | primary package checkout, read-only stable production scope | source base `14afc33` | `bdb33b2d5` completed | inspect only; wrote scratch reports | retained `execution/feature-design*.md`; source unchanged | complete; 5.95MB exact reported overflow files removed; integration hold released |
| D2 blocker challenge | primary package checkout + installed Pi SDK read-only | Pi0.84/0.86 host API scope | `ba3971c2d` / PID 88175 | no source writes; independent missing-API review | pending | active; no extra worktree |

Old review snapshot copies were not Git worktrees. Cleanup receipts are recorded below once retained evidence has been verified.

## Active unit decisions and boundaries

Operator critical clarification: ALL implementation and independent review runs in background Sol 5.6/max subscription workers. Parent coordinates/integrates only; no Astra workers, substitutions, paid frontier APIs, or Fusion. B0 is assigned to a Sol worker in the existing primary package checkout (not a third auxiliary worktree); parent edits only maintenance state while it runs.

- **B0/Sol worker in primary checkout:** replace regex-only TypeScript escape scanning with compiler syntax-tree checks (comments/strings not types; actual compiler directive comments still rejected). Detect file-URL `.pathname` conversions without rejecting HTTPS `.pathname`. Make offline pack installation self-contained from installed production-dependency tarballs via isolated local registry/cache preparation, retaining real transitive dependency loading and zero external network in the offline install. Ownership: `tests/package/{type-safety,package}.test.ts`, focused `tests/helpers/` additions, testing docs. Consumer: trustworthy default package gates. Red: baseline type-safety/URL/ENOTCACHED receipts plus negative controls. Actual attribution double assertion is owned by A1 worker, not edited concurrently. Windows fake launcher fixture coordination belongs to L1 next.
- **A1+A2/worker:** use PR #17's deterministic non-inheriting epoch reset for legitimate reconstructed history/profile drift; never weaken request middleware/signature/concurrency boundaries. Incorporate PR #12 transport regression. #13 adds explicit absolute account-config path with documented precedence over existing home default; invalid configuration stays loud, no inferred undocumented convention. #19 must use a supported host-exported implementation, not eval/import tricks or recursive registered adapters; prove Node and compiled Bun paths where available. Ownership: attribution production files, attribution-specific unit/SDK/loader fixtures and authored attribution/config docs; also replace its real double assertion with validated typing. Red: frozen tests-only #17 reproduction plus focused new cases. Consumer: actual transport and Pi lifecycle. Stop at local commits and bounded report; no generated-doc, shared QA-file, main checkout or remote changes.
- **L1/Sol worker in primary:** combine PR9 POSIX no-PATH fallback and PR23 named Windows host-package discovery into one validated resolver. Verify executable permissions on POSIX and genuine Pi package identity for host JS entries; retain realpath/bin containment and safe structured argv. Fix Windows fake-child harness interception by exercising the intended installed-host route, not skipping tests or adding a test-only production bypass. Ownership: `src/core/pi-launch.ts`, `tests/unit/pi-launch.test.ts`, launcher-specific SDK/helper fixtures, authored `docs/subsystems/child-launch-durability-and-safety.md`; preserve B0 helpers/package tests and other worker paths. Red: no-PATH legitimate Pi host, non-executable PATH/arbitrary JS refusal, Windows nearest named manifest/fixture cases. Consumer: all existing delegate/Fusion/attested child launches. Native Windows remains qualification gap, not implementation excuse. No generated/shared QA edits; stop at local commit + source-bound report.
- **C1/P1/D1/D2 design worker:** inspect real supported Pi hooks/tool execution and docs-engine conditional-surface behavior before committing feature architecture. Must supply exact compatible/opt-in policy, source citations, red-first scenarios and non-overlapping implementation missions. Source is read-only; no design-as-completion or invented host APIs. Report at scratch `reports/feature-design.md`.
- **R1/worker:** separate abandonment from delivered truth; explicitly typed EventBus closure; cancel timers on shutdown/disposal; recheck after async publication gates; bound genuine persistent listener failures (small explicit retry policy) while preserving transient retries/deduplication. Ordinary and managed tasks retain durable terminal metadata and waiter completion. Ownership: registry/EventBus source, necessary terminal-state fields only in `common.ts`, lifecycle-only `extension.ts` sections, focused registry/EventBus/SDK tests and owning runtime/EventBus/host docs. Red: adapted #25 regressions plus late-gate/persistent failure controls. Consumer: actual registered extension shutdown/reload path. Stop at local commits/report, no feature registration/shell work or generated/shared QA edits.

## Environment/decision blockers to resolve honestly

- Native Windows qualification unavailable so far; compiled Bun reproduction not yet executed. Do not certify them from macOS mocks.
- Pi compatibility policy must reconcile declared 0.81–0.84 lines with reports on 0.85.1 and host 0.86.0.
- Shell defaults, feature dependencies, reload-vs-quit semantics, and auto-background tool ownership need explicit local design records under the compatibility/opt-in boundary.
- Current main has known baseline gate failures. Contributor patches passing focused tests do not make the full release gate green.
- Any indispensable modification outside the standalone package needs new scope authorization. No monorepo worktrees, full-repo copying, or repository-wide test scans.

## Boundary incident and prevention

B0 disclosed one discarded scratch probe using `npm pack node_modules/turndown` without an absolute or `./` path. npm parsed this as git shorthand and attempted `git ls-remote ssh://git@github.com/node_modules/turndown.git`; exit128, repository not found, no input fetched/installed and no remote write. This nevertheless violated the no-GitHub-interaction boundary. Preserved in the worker report and `logs/baseline/exploratory-probe-failure.log`. All final B0 red/green checks were offline or task-owned loopback only. Future worker launches set `GIT_ALLOW_PROTOCOL=file`; briefs require explicit absolute filesystem operands for npm packaging. This prevents accidental Git network transports rather than excusing the violation.

## Cleanup receipts

- Verified all 49 frozen evidence files before removing original review inputs.
- Removed exact owned snapshot copies `.../T/pi-bg-pr-checks-1orh1dnb` (about 154 MiB) and `.../T/pi-bg-pr-checks-llw9apxj` (failed setup residue). These were unregistered archive copies, not Git worktrees; checked their expected variant-directory inventory first.
- Unlinked only their own `node_modules` symlinks, verified targets pointed at package dependencies, and confirmed the shared package `node_modules` remained intact.
- Removed superseded `/tmp/pi-bg-review-20260920-w43Cyd` (about 2.5 MiB) and its matching marker only after retaining normalized evidence and frozen patches here. No resumption depends on those paths.
- Removed the detached package-only smoke worktree through normal `git worktree remove`; no force. Final package worktree inventory has only the pre-existing main/admin entry; package prune dry-run reports nothing stale.
- Retained dossier is under 0.5 MiB on disk. Approximately 156 MiB of old review scratch reclaimed, plus the 17 MiB proof worktree created and removed during prep. No owned workers/watchers were launched during preparation.
- Preparation validation: all six frozen PR patches pass `git apply --check` individually against current production baseline; `npm run docs:verify` PASS (31 surfaces/50 sources, semantic receipts advisory); `npm run payload:check` PASS (106 files); `npm pack --dry-run --ignore-scripts --json` confirms `maintenance/` is excluded; staged `git diff --check` PASS. All staged paths are within this dossier.
- Final preparation commit receipt: see the local prep commit and its message. No runtime implementation or full release certification is claimed.
