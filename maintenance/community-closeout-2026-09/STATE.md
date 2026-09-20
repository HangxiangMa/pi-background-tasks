# Live execution state

Last updated: 2026-09-20. Update this file at meaningful integration/checkpoint boundaries, not every tool call.

## Current stage

**BASELINE_PREPARED — implementation has not started.**

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
| B0 | Trustworthy type-safety, file-URL, offline install gates; Windows SDK fixtures | PENDING | Baseline reproduction + protective negative controls retained |
| A1 | #14/#17 and #12 attribution recovery/coverage | PENDING | Recorded reset semantics, real lifecycle red/green, inherited safety tests |
| A2 | #13 config path; #19 non-target transport loading | PENDING | Config precedence decision; actual Node/compiled-loader proof |
| R1 | #24/#25 terminal delivery/disposal | PENDING | Truthful abandoned state, bounded retry/gated-shutdown red/green |
| L1 | #9/#23 child executable resolution | PENDING | Unified platform policy; installed-layout/argv/identity qualification |
| C1 | #20 feature selection, #16 shortcut, #15 docs, #11 shell | PENDING | Public config/default decisions and observable consumer behavior |
| P1 | #21/#22 startup performance | PENDING | Reproducible baseline/after benchmark + cold invocation/lifecycle tests |
| D1 | #6 opt-in reload survival | PENDING | Durable process identity/ownership/exit/handoff design + real process proof |
| D2 | #18 opt-in auto-background Bash | PENDING | Exact once-only execution/promotion/cancel/notification/override design |
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

No active task-owned auxiliary worktrees, worker branches, or agents at the end of baseline prep.

Add rows only for resources created by this programme:

| Unit | Realpath | Branch/base | Task/PID | Ownership | Integration proof | Cleanup |
|---|---|---|---|---|---|---|
| baseline proof | `/tmp/pi-bg-wt-proof-s7ntno/package-only` | detached `14aa4ef` | no agent | package-only worktree | no modifications | removed normally; parent temp dir removed; prune dry-run empty |

Old review snapshot copies were not Git worktrees. Cleanup receipts are recorded below once retained evidence has been verified.

## Environment/decision blockers to resolve honestly

- Native Windows qualification unavailable so far; compiled Bun reproduction not yet executed. Do not certify them from macOS mocks.
- Pi compatibility policy must reconcile declared 0.81–0.84 lines with reports on 0.85.1 and host 0.86.0.
- Shell defaults, feature dependencies, reload-vs-quit semantics, and auto-background tool ownership need explicit local design records under the compatibility/opt-in boundary.
- Current main has known baseline gate failures. Contributor patches passing focused tests do not make the full release gate green.
- Any indispensable modification outside the standalone package needs new scope authorization. No monorepo worktrees, full-repo copying, or repository-wide test scans.

## Cleanup receipts

- Verified all 49 frozen evidence files before removing original review inputs.
- Removed exact owned snapshot copies `.../T/pi-bg-pr-checks-1orh1dnb` (about 154 MiB) and `.../T/pi-bg-pr-checks-llw9apxj` (failed setup residue). These were unregistered archive copies, not Git worktrees; checked their expected variant-directory inventory first.
- Unlinked only their own `node_modules` symlinks, verified targets pointed at package dependencies, and confirmed the shared package `node_modules` remained intact.
- Removed superseded `/tmp/pi-bg-review-20260920-w43Cyd` (about 2.5 MiB) and its matching marker only after retaining normalized evidence and frozen patches here. No resumption depends on those paths.
- Removed the detached package-only smoke worktree through normal `git worktree remove`; no force. Final package worktree inventory has only the pre-existing main/admin entry; package prune dry-run reports nothing stale.
- Retained dossier is under 0.5 MiB on disk. Approximately 156 MiB of old review scratch reclaimed, plus the 17 MiB proof worktree created and removed during prep. No owned workers/watchers were launched during preparation.
- Preparation validation: all six frozen PR patches pass `git apply --check` individually against current production baseline; `npm run docs:verify` PASS (31 surfaces/50 sources, semantic receipts advisory); `npm run payload:check` PASS (106 files); `npm pack --dry-run --ignore-scripts --json` confirms `maintenance/` is excluded; staged `git diff --check` PASS. All staged paths are within this dossier.
- Final preparation commit receipt: see the local prep commit and its message. No runtime implementation or full release certification is claimed.
