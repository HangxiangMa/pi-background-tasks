---
doc_id: subsystems/host-ui-and-telemetry
audience: maintainer
mode: authored
review_policy: behavioral
stability: stable
covers_surfaces: []
covers_sources: [extensions/background-tasks.ts, src/core/config.ts, src/core/update-check.ts, src/extension.ts, src/ui/background-tasks-manager.ts]
---
# Host UI and telemetry

This subsystem owns the extension entrypoint, command/tool registration, footer dock, task manager UI, completion renderer, and update-available footer notice. Task lifecycle internals are owned by [background-task-runtime](background-task-runtime.md).

## Entrypoint and registration

`extensions/background-tasks.ts` re-exports `src/extension.ts`. Before creating the registry or registering a surface, the extension strictly parses the shared capability/shortcut configuration. `process` is mandatory and registers:

- commands: `/bg`, `/tasks`, `/bg-tasks`, `/bg-clear`, `/bg-update`, `/jobs`, `/logs`, `/kill`;
- tools: `bg_run`, `bg_status`, `bg_logs`, `bg_kill`;
- shortcut: the selected dock key (`shift+down`, `ctrl+alt+b`, or none for `off`) plus unconditional `ctrl+alt+c`;
- renderer: `background-task-notification`;
- the task UI and EventBus service.

Delegate, Fusion, attested-run, and ambient attribution registrations are independently selected by `PI_BG_FEATURES`. `bg_result` is derived and registered once iff delegate or Fusion is enabled. Disabled registrations are absent rather than merely inactive. A final session-start reconciliation removes stale advanced active-tool names and adds only enabled, actually registered names after reload. The default selection preserves the complete historical surface. Capability flags alone make no startup-performance claim.

## Footer status

The footer widget is updated on task changes and once per second while a session is active. If there are no running tasks and no unseen finished tasks, the background-task footer is cleared unless an update segment is available.

When visible, the footer label includes counts in this order:

1. running,
2. failed,
3. stopped (`killed`),
4. done (`completed`),
5. entry hint (`focused` while the dock is open, otherwise `Shift↓`, `CtrlAltB`, or `/tasks` from the parsed dock setting),
6. `/bg-clear` hint when there are unseen finished tasks **and the dock is closed**,
7. optional update segment.

A finished badge is cleared when that task's detail view is opened, or when `/bg-clear` or its shortcut marks all currently unseen finished tasks as seen. Merely opening the list view or closing the dock does not clear badges.

## Task manager UI

`/tasks`, `/bg-tasks`, and the configured dock shortcut (when not `off`) open the same overlay. The two commands are unconditional process surfaces, including when the shortcut is disabled. Non-interactive contexts receive an error notification directing users to `/jobs`, `/logs`, `bg_status`, or `bg_logs`.

The list view supports selection, paging, stop, confirmed stop-all, history toggle, rerun, output path, and close. Rerun is shell-task-only: typed delegate and Fusion tasks fail with guidance to relaunch through their owning tool rather than executing their display command as a shell command. The detail view shows task identity, status, runtime, output path, description, task-owned model/context/tokens/tools when reported, command, error, and an output tail.

Detail output semantics:

- reads a UI-only tail buffer of 128 KiB;
- refreshes every second only while following;
- shows 12 output lines;
- scrolling up pauses follow and freezes the buffer;
- reaching the bottom or pressing `r` resumes follow;
- missing output files and read failures are displayed in the detail box.

## Completion rendering

`background-task-notification` renders `[bg completed]`, `[bg failed]`, `[bg killed]`, or other status with task name, id, output path, and error. The notification content itself is produced by the runtime and may trigger a follow-up turn depending on task flags.

## Update check

The update check is one-shot per extension runtime, launched after `session_start` without blocking session startup. It is skipped for `PI_BG_DISABLE_UPDATE_CHECK=1`, `PI_OFFLINE=1`, or missing installed version. The npm registry URL defaults to `https://registry.npmjs.org` and can be overridden by `PI_BG_REGISTRY_URL`. Fetch is time-boxed by `DEFAULT_UPDATE_TIMEOUT_MS` (2000 ms) and every network/status/payload failure resolves to no update segment.

When a newer semver is found, the footer segment is `⬆ v<latest> /bg-update`. `/bg-update` prints npm/git install instructions only; it never installs or self-updates.

## Telemetry display

The host UI displays telemetry only from task snapshots: context, model, token totals, and tool counts. When unavailable, detail rows say `not reported by this background task`. The UI never copies telemetry from the parent session into a task.

## Shutdown

On session shutdown, the extension marks the registry as shutting down, clears the status interval, kills running tasks with reason `Killed during Pi session shutdown/reload`, reports cleanup failures through the UI when possible, and closes the event service.

## Related docs

- [Shortcuts and dock](../reference/shortcuts-and-dock.md)
- [`/tasks` and `/bg-tasks`](../commands/task-manager.md)
- [`/bg-clear`](../commands/bg-clear.md)
- [`/bg-update`](../commands/bg-update.md)
- [Completion delivery](../concepts/completion-delivery.md)
- [Background task runtime](background-task-runtime.md)

## Source ownership/reference

Primary source ownership for this document is `extensions/background-tasks.ts`, `src/extension.ts`, `src/core/update-check.ts`, and `src/ui/background-tasks-manager.ts`.
