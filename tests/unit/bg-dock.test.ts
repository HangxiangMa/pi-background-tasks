import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderBgDock, shouldShowBgDock, type BgDockRow } from '../../src/ui/bg-dock.js';

// Plain-text colour: the assertions check words and layout, not escape codes.
const fg = (_color: 'dim' | 'muted', text: string): string => text;

function row(id: string, name: string, bytesWritten: number, startTime = 0): BgDockRow {
  return { id, name, bytesWritten, startTime };
}

void describe('renderBgDock', () => {
  void it('draws nothing when no task is running, so the caller can clear the widget', () => {
    assert.deepEqual(renderBgDock({ rows: [], now: 1000 }, fg, 80), []);
  });

  void it('shows the running count, then one row per task with name, id, elapsed time and output size', () => {
    const lines = renderBgDock(
      { rows: [row('b1', 'sleep', 2048, 0)], now: 65_000 },
      fg,
      80,
    );
    assert.equal(lines[0], 'bg · 1 running');
    assert.equal(lines.length, 2);
    // formatSize is pi's helper: 2048 bytes renders as "2.0KB" (no space).
    assert.match(lines[1] ?? '', /sleep b1 · 1m5s · 2\.0KB out/);
  });

  void it('caps the rows at four and collapses the rest into a +K more line', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((n) => row(`t${String(n)}`, `job${String(n)}`, 0));
    const lines = renderBgDock({ rows, now: 0 }, fg, 80);
    // header + 4 rows + "+2 more"
    assert.equal(lines.length, 6);
    assert.equal(lines[0], 'bg · 6 running');
    assert.equal(lines.at(-1), '  +2 more');
    assert.doesNotMatch(lines.join('\n'), /job5|job6/);
  });

  void it('does not add a +more line when the rows fit', () => {
    const rows = [1, 2, 3, 4].map((n) => row(`t${String(n)}`, `job${String(n)}`, 0));
    const lines = renderBgDock({ rows, now: 0 }, fg, 80);
    assert.equal(lines.length, 5);
    assert.doesNotMatch(lines.join('\n'), /more/);
  });

  void it('truncates a long row to the given width, with an ellipsis', () => {
    const longName = 'x'.repeat(200);
    const lines = renderBgDock({ rows: [row('b1', longName, 0)], now: 0 }, fg, 30);
    const taskLine = lines[1] ?? '';
    assert.equal(taskLine.length, 30);
    assert.equal(taskLine.at(-1), '…');
  });

  void it('clamps a negative elapsed time to zero rather than printing a negative duration', () => {
    const lines = renderBgDock({ rows: [row('b1', 'job', 0, 5000)], now: 1000 }, fg, 80);
    assert.match(lines[1] ?? '', /· 0ms ·/);
  });

  void it('shows the dock only when the widget switch is on, whatever the task count', () => {
    assert.equal(shouldShowBgDock('on'), true);
    assert.equal(shouldShowBgDock('off'), false);
  });
});
