import { formatSize } from '@earendil-works/pi-coding-agent';
import { formatDuration } from '../core/common.js';
/** Widget key for the /bg footer dock. Distinct from the `background-tasks` modal key. */
export const BG_DOCK_WIDGET_KEY = 'background-tasks-dock';
/** Most rows the dock draws before collapsing the rest into `+K more`. */
export const BG_DOCK_MAX_ROWS = 4;
/**
 * Render the footer dock as lines. Pure: no timers, no I/O, so the same frame always gives the same lines.
 * Returns no lines when nothing is running, so the caller can clear the widget.
 */
export function renderBgDock(frame, fg, width) {
    if (frame.rows.length === 0)
        return [];
    const shown = frame.rows.slice(0, BG_DOCK_MAX_ROWS);
    const hidden = frame.rows.length - shown.length;
    const lines = [fg('dim', `bg · ${String(frame.rows.length)} running`)];
    for (const row of shown) {
        const elapsed = formatDuration(Math.max(0, frame.now - row.startTime));
        const size = formatSize(row.bytesWritten);
        const text = `  ${row.name} ${row.id} · ${elapsed} · ${size} out`;
        lines.push(fg('muted', truncate(text, width)));
    }
    if (hidden > 0)
        lines.push(fg('dim', `  +${String(hidden)} more`));
    return lines;
}
/** Trim to `width` columns, adding an ellipsis when cut. Plain code units; the dock text is ASCII-safe. */
function truncate(text, width) {
    if (width <= 0 || text.length <= width)
        return text;
    if (width <= 1)
        return text.slice(0, width);
    return `${text.slice(0, width - 1)}…`;
}
//# sourceMappingURL=bg-dock.js.map