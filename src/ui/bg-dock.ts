import { formatSize } from '@earendil-works/pi-coding-agent';
import { formatDuration } from '../core/common.js';

/** Widget key for the /bg footer dock. Distinct from the `background-tasks` modal key. */
export const BG_DOCK_WIDGET_KEY = 'background-tasks-dock';

/** Most rows the dock draws before collapsing the rest into `+K more`. */
export const BG_DOCK_MAX_ROWS = 4;

/**
 * Whether the footer dock widget is registered at all. Only the widget switch decides: with it off
 * nothing is drawn, but the dock shortcut and the /tasks manager still work.
 */
export function shouldShowBgDock(widget: 'on' | 'off'): boolean {
  return widget === 'on';
}

export interface BgDockRow {
  name: string;
  id: string;
  startTime: number;
  bytesWritten: number;
}

export interface BgDockFrame {
  rows: BgDockRow[];
  now: number;
}

/** The only two colours the dock uses. Narrowed so the real theme.fg type-checks. */
export type BgDockColor = 'dim' | 'muted';

/** Colour function for the dock. A plain function is enough; tests pass one. */
export type BgDockFg = (color: BgDockColor, text: string) => string;

/**
 * Render the footer dock as lines. Pure: no timers, no I/O, so the same frame always gives the same lines.
 * Returns no lines when nothing is running, so the caller can clear the widget.
 */
export function renderBgDock(frame: BgDockFrame, fg: BgDockFg, width: number): string[] {
  if (frame.rows.length === 0) return [];
  const shown = frame.rows.slice(0, BG_DOCK_MAX_ROWS);
  const hidden = frame.rows.length - shown.length;
  const lines = [fg('dim', `bg · ${String(frame.rows.length)} running`)];
  for (const row of shown) {
    const elapsed = formatDuration(Math.max(0, frame.now - row.startTime));
    const size = formatSize(row.bytesWritten);
    const text = `  ${row.name} ${row.id} · ${elapsed} · ${size} out`;
    lines.push(fg('muted', truncate(text, width)));
  }
  if (hidden > 0) lines.push(fg('dim', `  +${String(hidden)} more`));
  return lines;
}

/** Trim to `width` columns, adding an ellipsis when cut. Plain code units; the dock text is ASCII-safe. */
function truncate(text: string, width: number): string {
  if (width <= 0 || text.length <= width) return text;
  if (width <= 1) return text.slice(0, width);
  return `${text.slice(0, width - 1)}…`;
}
