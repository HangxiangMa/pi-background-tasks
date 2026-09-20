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
| B0 | Trustworthy type-safety, file-URL, offline install gates; Windows SDK fixtures | IMPLEMENTED_UNVERIFIED URL policy; type/npm VERIFIED_LOCAL | `f8d74b9`: explicitcompletion/syntaxpass/WHATWG correction,8fixtures+fullscan+tsc pass; independent verification includes original module-relative known-file-base protection |
| A1 | #14/#17 and #12 attribution recovery/coverage | VERIFIED_LOCAL / merged | Runtime and fixture independently accepted; ancestry-preserving main merge `bc25e9a`; integrated/full-platform gates pending |
| A2 | #13 config path; #19 non-target transport loading | VERIFIED_LOCAL / merged | Fixture verification PASS incl absentglobal compiler,11refusals,network-denied actual0.86 proof; no peer-range/general0.86/vendorbinary claims |
| R1 | #24/#25 terminal delivery/disposal | IN_PROGRESS (remaining admission-preflight blocker) | Re-review accepts late-start/retention/reentrant/real lifecycle fixes; HIGH hanging Git preflight holds admission/drain forever. Signal/deadline/child reaping correction active |
| L1 | #9/#23 child executable resolution + Windows fake-child fixtures | IMPLEMENTED_UNVERIFIED (targeted independent re-review) | `6c314ab`: pinnedcanonicalspawn realprobes +26unit/14delegate/72child tests pass;5findings corrected; nativeWindows/vendor qualification pending |
| C1a | #20 capability selection + #16 configurable/disabled dock + finite docs variants | IN_PROGRESS (Sol worker) | Registration-only slice in replacement package worktree; preserve lifecycle/common/registry ownership; real consumers with docs grammar |
| C1b | #11 shell policy | PENDING (after R1 admission integration) | Preserve inherited default, explicit Bash/sh selection and truthful resolved guidance; separate common/registry ownership |
| F1 | #15 Fusion role/quality/speed/context docs | VERIFIED_LOCAL (committed; integrated qualification pending) | `0a69a4f`+`7628f4d`; independent prose signoff, exact reviewer type remedy/byte proof, strict tsc red→green and3/3 tests; accepted docs unchanged |
| P1 | #21/#22 startup performance | PENDING (Sol design received) | Same surface owner as C1; single-flight late-loading with lifecycle guards and measured distributions |
| D1 | #6 opt-in reload survival | PENDING (Sol design received) | Real Pi shutdown reason distinguishes reload; living same-process execution handoff, never PID/file adoption |
| D2 | #18 opt-in auto-background Bash | BLOCKED_DECISION (confirmed outside-package host capability) | Two independent Sol inspections + real Pi0.84/0.86/bundled-host probes confirm missing atomic effective-tool execution/cancellation lease; no compliant package-only takeover; see `execution/bash-transfer/review.md` |
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
| A1+A2 | `/private/tmp/pi-bg-closeout-iNoltL/attribution` | former `closeout/attribution` tip94b3674 | allworkers/reviews complete | noactiveownership | merged `bc25e9a8d8be74bd38899e56bb7ab2266629969c`; tip proven ancestor | owned dependency symlink unlinked only; clean worktree removed normally; integrated branch deleted with -d; prune dryrunempty |
| C1a | `/private/tmp/pi-bg-closeout-iNoltL/features` | `closeout/features` @ `bc25e9a8d8be74bd38899e56bb7ab2266629969c` | `bc63c7df5` / PID38054 | capability/shortcut registration+docs extractor only; no R1 execution/lifecycle/common changes | pending | active, packageboundaryverified; readonlydependencylink; secondaux alongside delivery; total scratch103MiB atlaunch |
| R1 | `/private/tmp/pi-bg-closeout-iNoltL/delivery` | `closeout/delivery` @ `424a1d3`, preflight followup pending | re-review `b927dd1f1` complete; correction `b393cdb66` / PID27142 | admission cancellation + necessary attested Git/durability dependency; accepted publication/lifecycle semantics frozen | review retained `execution/delivery-review-2/review.md`; bounded real Git cleanup required | correction active; same worktree, no extra checkout |
| B0 | primary package checkout (existing, not auxiliary) | URLfollowup `f8d74b9c308dabd6a1c7bc8e3a9bf1472feaadf0` | correctioncomplete; verification `b956c5299` / PID33316 | fiveURLpaths frozen; type/npm unchangedhashes | worker5pathhashes matched beforemechanicalcommit; reports retained `execution/url-guard-fix/` | reviewactive; workerscratch empty/zerochildren; noextra checkout |
| L1 | primary package checkout (existing, not auxiliary) | followup `6c314ab3eb2c6835b2d81b8db8a29a419315e9e2` | correctioncomplete; review `b1629e315` / PID32184 | fiveL1paths frozen; indexlease released | report/design retained `execution/launcher-fix/`; exactcanonicalspawnproof | reviewactive; workerrootsremoved/zerochildren; noextracheckout |
| F1 | primary package checkout (existing) | `0a69a4f`+`7628f4d7baf524234b14dbb9e5c7d418525ffe40` | allF1workers complete | noactivewriter; testSHA256 `feea45e8...`, unchangeddocs | exactreviewer3-line remedy committedafterL1terminal; retainedreports/compilerproof | complete; workerroots empty/zerochildren |
| C1/P1/D1/D2 design | primary package checkout, read-only stable production scope | source base `14afc33` | `bdb33b2d5` completed | inspect only; wrote scratch reports | retained `execution/feature-design*.md`; source unchanged | complete; 5.95MB exact reported overflow files removed; integration hold released |
| D2 blocker challenge | primary package checkout + installed Pi SDK read-only | Pi0.84/0.86 host API scope | `ba3971c2d` completed | no source writes; independent missing-API review | report + probe source/output/source hashes retained under `execution/bash-transfer/` | complete; exact reported 5.34MB overflow files removed; no extra worktree |

Old review snapshot copies were not Git worktrees. Cleanup receipts are recorded below once retained evidence has been verified.

## Active unit decisions and boundaries

Operator critical clarification: ALL implementation and independent review runs in background Sol 5.6/max subscription workers. Parent coordinates/integrates only; no Astra workers, substitutions, paid frontier APIs, or Fusion. B0 is assigned to a Sol worker in the existing primary package checkout (not a third auxiliary worktree); parent edits only maintenance state while it runs.

- **B0/Sol worker in primary checkout:** replace regex-only TypeScript escape scanning with compiler syntax-tree checks (comments/strings not types; actual compiler directive comments still rejected). Detect file-URL `.pathname` conversions without rejecting HTTPS `.pathname`. Make offline pack installation self-contained from installed production-dependency tarballs via isolated local registry/cache preparation, retaining real transitive dependency loading and zero external network in the offline install. Ownership: `tests/package/{type-safety,package}.test.ts`, focused `tests/helpers/` additions, testing docs. Consumer: trustworthy default package gates. Red: baseline type-safety/URL/ENOTCACHED receipts plus negative controls. Actual attribution double assertion is owned by A1 worker, not edited concurrently. Windows fake launcher fixture coordination belongs to L1 next.
- **A1+A2/worker:** use PR #17's deterministic non-inheriting epoch reset for legitimate reconstructed history/profile drift; never weaken request middleware/signature/concurrency boundaries. Incorporate PR #12 transport regression. #13 adds explicit absolute account-config path with documented precedence over existing home default; invalid configuration stays loud, no inferred undocumented convention. #19 must use a supported host-exported implementation, not eval/import tricks or recursive registered adapters; prove Node and compiled Bun paths where available. Ownership: attribution production files, attribution-specific unit/SDK/loader fixtures and authored attribution/config docs; also replace its real double assertion with validated typing. Red: frozen tests-only #17 reproduction plus focused new cases. Consumer: actual transport and Pi lifecycle. Stop at local commits and bounded report; no generated-doc, shared QA-file, main checkout or remote changes.
- **F1/Sol worker in primary:** explain Candidate1–3 parallel identical-purpose roles, blind evaluator/same-slot optional repair, sequential merger/fan-in and quality/speed/context tradeoffs with valid `$current`/subscription examples. Five slots are not five distinct models or guaranteed five calls. Ownership: authored `docs/commands/fusion-models.md`, authored Fusion subsystem explanatory prose, new focused package docs test only. No generated/config/shared QA files. Red: missing required role contract/prose examples; consumer: actual `/fusion-models` user guide. Stop at local doc+test commit; reviewed later with C1 content/integration.
- **L1/Sol worker in primary:** combine PR9 POSIX no-PATH fallback and PR23 named Windows host-package discovery into one validated resolver. Verify executable permissions on POSIX and genuine Pi package identity for host JS entries; retain realpath/bin containment and safe structured argv. Fix Windows fake-child harness interception by exercising the intended installed-host route, not skipping tests or adding a test-only production bypass. Ownership: `src/core/pi-launch.ts`, `tests/unit/pi-launch.test.ts`, launcher-specific SDK/helper fixtures, authored `docs/subsystems/child-launch-durability-and-safety.md`; preserve B0 helpers/package tests and other worker paths. Red: no-PATH legitimate Pi host, non-executable PATH/arbitrary JS refusal, Windows nearest named manifest/fixture cases. Consumer: all existing delegate/Fusion/attested child launches. Native Windows remains qualification gap, not implementation excuse. No generated/shared QA edits; stop at local commit + source-bound report.
- **C1a parallel strategy:** now that attribution is accepted/merged and its worktree removed, use exactly that freed slot for registration-only capability/shortcut work plus narrow finite docs extraction and real consumers. Defer shell/common/registry/lazy-admission/persistence edits until R1 finishes. Keep lifecycle blocks unchanged; later overlapping integration/reconciliation is assigned to Sol, not blindly merged. Capability defaults/full surface preserved, derived bg_result shared, ambient attribution disabled independently but explicit child safety remains mandatory; finite dock shortcut variants from Sol design. No infrastructure-only commit or code-to-prose workaround. P1 still owns deferred import/performance qualification, so C1a does not claim startup improvements.
- **C1/P1/D1/D2 design worker:** inspect real supported Pi hooks/tool execution and docs-engine conditional-surface behavior before committing feature architecture. Must supply exact compatible/opt-in policy, source citations, red-first scenarios and non-overlapping implementation missions. Source is read-only; no design-as-completion or invented host APIs. Report at scratch `reports/feature-design.md`.
- **R1/worker:** separate abandonment from delivered truth; explicitly typed EventBus closure; cancel timers on shutdown/disposal; recheck after async publication gates; bound genuine persistent listener failures (small explicit retry policy) while preserving transient retries/deduplication. Ordinary and managed tasks retain durable terminal metadata and waiter completion. Ownership: registry/EventBus source, necessary terminal-state fields only in `common.ts`, lifecycle-only `extension.ts` sections, focused registry/EventBus/SDK tests and owning runtime/EventBus/host docs. Red: adapted #25 regressions plus late-gate/persistent failure controls. Consumer: actual registered extension shutdown/reload path. Stop at local commits/report, no feature registration/shell work or generated/shared QA edits.

## Environment/decision blockers to resolve honestly

- Native Windows qualification unavailable so far; compiled Bun reproduction not yet executed. Do not certify them from macOS mocks.
- Pi compatibility policy must reconcile declared 0.81–0.84 lines with reports on 0.85.1 and host 0.86.0. Node engine is `>=22.19.0`; CI uses22.19.0/24.x. Both supported Node22.19.0 and24.16.0 are installed locally, so their qualification is feasible. Node20.11.1 also exists but is below the packageengine and not a required support target.
- Shell defaults, feature dependencies, reload-vs-quit semantics, and auto-background tool ownership need explicit local design records under the compatibility/opt-in boundary.
- Current main has known baseline gate failures. Contributor patches passing focused tests do not make the full release gate green.
- #18 genuinely needs a supported host post-permission execution interceptor/lease. Independent probe proved `getAllTools()` lacks effective execute/settings, in-memory host SettingsManager cannot be reconstructed, and late dynamic Bash overrides can be silently hidden by package replacement on both Pi0.84 and0.86 (including real bundled0.86). No documented D2 flag, mock capability, kill/restart, or replacement-only approximation will be shipped. Requires a host release/API or explicit new scope; all other units continue.
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
