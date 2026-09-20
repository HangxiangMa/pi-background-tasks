# Live execution state

Last updated: 2026-09-21.

## Current stage

**LOCAL IMPLEMENTATION COMPLETE — final performance evidence, blocker receipts, and cleanup remain.**

- Package main: `154e97f` (`perf(runtime): ship compiled conditional startup graph`).
- Package version: `2.5.0`.
- Parent repository remains untouched.
- No closeout push, publish, tag, GitHub mutation, or remote closure occurred.
- No agents are running. After operator correction, final integration, P1b implementation, test repair, and qualification were performed directly by the parent agent.
- All 11 issues and 6 PRs now have either integrated package work or a precise upstream/environment blocker. “Closure-ready” remains local evidence vocabulary, not remote closure.

## Integrated work

| Unit | Tickets | Local state |
|---|---|---|
| Baseline gates | release prerequisite | Integrated: compiler-backed type safety, file-URL dataflow, lifecycle-free real offline dependency archives, npm 10/11 policy, Windows-equivalent launch fixtures |
| Attribution | #13, #14, #19; PR #12, #17 | Integrated and locally verified: configurable account path, reload lineage recovery, lossless non-target forwarding, contributor credit retained |
| Delivery/runtime | #24; PR #25 | Integrated and locally verified: pending/delivered/abandoned truth, typed closure, bounded retries, admission cancellation, process-tree and durable-write ownership |
| Launcher | PR #9, #23 | Integrated and locally verified: executable POSIX route, named installed-package fallback, Windows structured launcher fixtures, contributor credit retained |
| Fusion docs | #15 | Integrated and locally verified |
| Features/shell | #11, #16, package-owned #20 | Integrated and locally verified: finite capabilities, derived result surface, mandatory child attribution, configurable/off dock, compatible explicit POSIX shell policy |
| Reload survival | #6 | Integrated at `71114b0`, `4557978`, `a1c5a44`: opt-in same-process ordinary shell ownership survives real POSIX reload; final three settlement races corrected |
| Lazy startup | #21; PR #22 | Integrated at `8225f48`, `78be81f`, `cc80b2b`, `c6c2c94`, `154e97f`: lazy execution/verifier/UI/attested/attribution lanes plus compiled JS distribution; PR credit retained |
| Integration seam | #6 + #21 | `de98ee0`: one synchronous close fence performs eligible reload handoff and closes all lazy lanes before awaited cleanup |

## Final local verification completed

Both Node lines used isolated `HOME`, `TMPDIR`, `PI_CODING_AGENT_DIR`, cache, offline/version/telemetry suppression, `CI=1`, and `GIT_ALLOW_PROTOCOL=file`.

| Gate | Node 24.16.0 | Node 22.19.0 |
|---|---:|---:|
| Typecheck | PASS | PASS |
| Type safety | 4/4 | 4/4 |
| Unit | 588/588 | 588/588 |
| SDK | 90/90 | 90/90 |
| RPC | 10/10 | 10/10 |
| Component | 12/12 | 12/12 |
| Package | 77/77 | 77/77 |
| Hook contract | 7/7 | 7/7 |
| Default total | **788/788** | **788/788** |
| PTY | 9/9 | 9/9 |
| Scripted-provider agent loop | 35/35 | 35/35 |
| Compiled smoke | PASS | PASS |
| Large-context smoke | PASS | not repeated |
| Docs generate/verify/tests | 32 surfaces / 60 sources; 8/8 | verify PASS |
| Payload | 236 files | 236 files |
| Pack dry run | 1.4 MB tarball / 5.8 MB unpacked | not repeated |

Two PTY cases initially failed on the unchanged baseline because fixed delays sent keys before async output/terminal settlement. Their harness now waits for actual output/terminal evidence; the full real PTY suite passes on both Node lines. One first integrated default run was invalidated by an unawaited direct call after the extension factory became async; the call was corrected and the complete SDK/default matrices pass.

## Remaining blockers and unsupported boundaries

| Ticket/surface | State | Precise boundary |
|---|---|---|
| #18 | `BLOCKED_UPSTREAM` | Pi exposes no atomic post-permission effective-Bash execution/cancellation lease. A package replacement would lose host settings or competing overrides; kill/restart/adoption is rejected. |
| #20 bare/empty SDK | `BLOCKED_UPSTREAM` | Bare `createAgentSession()`, empty-binding reload, and mode-only reload have no guaranteed fresh post-bind callback/provider owner token. Normal initialized TUI/RPC/print/JSON modes pass. |
| #6 Windows | `BLOCKED_ENVIRONMENT` | Native Windows unavailable. Mocks do not certify Windows process/pipe/handle continuity. |
| #6 host lifecycle | `BLOCKED_UPSTREAM` | Empty/mode-only reload and direct `AgentSession.dispose()` omit required lifecycle events. `AgentSessionRuntime.dispose()` is supported. |
| Crash/restart survival | unsupported by design | No PID/file adoption, hard-crash recovery, process restart, VM/realm replacement, or synthesized exit truth. |
| Vendor compiled Bun | `BLOCKED_ENVIRONMENT` | Bun 1.3.4 exists, but no vendor-compiled Pi binary is available; Node/Jiti compiled-JS evidence is not that certification. |
| pnpm gate | `BLOCKED_ENVIRONMENT` | No pnpm executable is installed. |
| exact Pi 0.81–0.84 compatibility reinstall | pending environment decision | The release script is offline-only; no isolated task-owned cache containing all exact package closures is currently available. Do not borrow the user cache or use network. |

## Remaining execution steps

1. Collect final 30-sample source-vs-compiled cold-load distributions on the clean integrated commit.
2. Record benchmark and unavailable-gate receipts without overstating Windows/Bun/pnpm/exact-version coverage.
3. Produce the ticket-by-ticket local closure-readiness report.
4. Prove both auxiliary branch tips are ancestors of main, unlink only owned dependency symlinks, remove both package-only worktrees normally, delete merged branches with `-d`, prune, and remove disposable scratch.
5. Commit final evidence/cleanup state. No remote action.

## Owned workspace ledger

| Resource | State | Cleanup rule |
|---|---|---|
| Main package checkout | `main` at `154e97f`; maintenance evidence pending | Keep; final source must be clean after evidence commit |
| `/private/tmp/pi-bg-closeout-iNoltL/reload-survival` | tip `354dbdf`; all three commits integrated as main ancestors | Verify ancestry/tree evidence, unlink owned `node_modules` symlink, normal worktree removal, branch `-d` |
| `/private/tmp/pi-bg-closeout-iNoltL/lazy-agents` | tip `60e3889`; all four commits integrated as main ancestors | Verify ancestry/tree evidence, normal worktree removal, branch `-d` |
| `/private/tmp/pi-bg-closeout-iNoltL` | retained reports plus disposable test/benchmark roots | Preserve final receipts first; remove task-owned bulky/transient roots, never force-delete unknown data |

Historical implementation/review receipts are retained under `execution/`. They document rejected intermediate states as well as accepted corrections; the current table above is authoritative for live state.
