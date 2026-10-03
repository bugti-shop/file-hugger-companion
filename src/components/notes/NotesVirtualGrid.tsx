/**
 * Window-virtualized notes grid. Renders the exact same card markup the
 * user already designed, but only paints rows currently in the viewport so
 * the UI stays identical and fast from 1 → 100,000 notes.
 *
 * Layout: 1 column on mobile, 2 on lg, 3 on xl — chunked into rows so we
 * can virtualize with stable row heights via @tanstack/react-virtual's
 * useWindowVirtualizer (no nested scroll container = bottom nav stays put,
 * page scroll behaves natively).
 */
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import type { Note } from '@/types/note';
import { logPerfEvent, startScopedScrollFpsMonitor } from '@/utils/perfLogger';
import { getAdaptiveOverscan, useVirtualizationSettings } from '@/utils/virtualizationSettings';

interface NotesVirtualGridProps {
  notes: Note[];
  renderCard: (note: Note) => ReactNode;
  getRowKey?: (row: Note[], index: number) => string;
  /** Approximate row height in px. Cards are roughly equal because the
   *  text is line-clamped to 4 lines + fixed header/footer chrome. */
  estimatedRowHeight?: number;
  /** Override global window/container virtualization for nested scroll areas. */
  useWindowing?: boolean;
}

type SectionRow = { kind: 'heading'; label: string; key: string } | { kind: 'note'; note: Note; key: string; last: boolean };

export function getNotesDateGroup(value: Date | string, now = new Date()): { key: string; label: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { key: 'unknown', label: 'Earlier' };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (date >= today) return { key: 'today', label: 'Today' };
  if (date >= yesterday) return { key: 'yesterday', label: 'Yesterday' };
  if (date >= weekStart) return { key: 'week', label: 'This Week' };
  const key = format(date, 'yyyy-MM');
  return { key, label: date.getFullYear() === now.getFullYear() ? format(date, 'MMMM') : format(date, 'MMMM yyyy') };
}

export function NotesVirtualGrid({
  notes,
  renderCard,
  getRowKey,
  estimatedRowHeight,
  useWindowing,
}: NotesVirtualGridProps) {
  const [virtualizationSettings] = useVirtualizationSettings();
  const parentRef = useRef<HTMLDivElement>(null);
  const resolvedRowHeight = estimatedRowHeight ?? 100;
  const resolvedOverscan = getAdaptiveOverscan(virtualizationSettings.notes.overscan, notes.length, 'notes');
  const resolvedWindowing = useWindowing ?? virtualizationSettings.notes.windowing;

  const rows = useMemo<SectionRow[]>(() => {
    const byGroup = new Map<string, { label: string; notes: Note[] }>();
    [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).forEach(note => {
      const { key, label } = getNotesDateGroup(note.updatedAt);
      if (!byGroup.has(key)) byGroup.set(key, { label, notes: [] });
      byGroup.get(key)?.notes.push(note);
    });
    return [...byGroup.entries()].flatMap(([key, section]) => [
      { kind: 'heading' as const, key: `heading-${key}`, label: section.label },
      ...section.notes.map((note, index) => ({ kind: 'note' as const, key: note.id, note, last: index === section.notes.length - 1 })),
    ]);
  }, [notes]);
  const rowCount = rows.length;

  // Offset accounts for the page header + filters that sit above this grid.
  const [scrollMargin, setScrollMargin] = useState(0);
  useEffect(() => {
    const measure = () => {
      const el = parentRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setScrollMargin(top);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rows.length]);

  const containerVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (idx) => rows[idx]?.kind === 'heading' ? 52 : resolvedRowHeight,
    overscan: resolvedOverscan,
    getItemKey: (idx) => {
      const row = rows[idx];
      return row?.kind === 'note' ? (getRowKey?.([row.note], idx) ?? row.key) : (row?.key ?? idx);
    },
  });

  const windowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: (idx) => rows[idx]?.kind === 'heading' ? 52 : resolvedRowHeight,
    // 6 rows of overscan (≈18 cards at 3-col) keeps fast flick-scrolling
    // smooth without paying paint cost for ~50 offscreen heavy cards when
    // the user has 5k+ notes with large bodies.
    overscan: resolvedOverscan,
    scrollMargin,
    getItemKey: (idx) => {
      const row = rows[idx];
      return row?.kind === 'note' ? (getRowKey?.([row.note], idx) ?? row.key) : (row?.key ?? idx);
    },
  });

  const virtualizer = resolvedWindowing ? windowVirtualizer : containerVirtualizer;

  useEffect(() => {
    logPerfEvent('render', {
      label: 'NotesVirtualGrid',
      itemCount: notes.length,
      rows: rowCount,
      columns: 1,
      overscan: resolvedOverscan,
      rowHeight: resolvedRowHeight,
      windowing: resolvedWindowing ? 'window' : 'container',
    });
  }, [notes.length, resolvedOverscan, resolvedRowHeight, resolvedWindowing, rowCount]);

  useEffect(() => {
    const target = resolvedWindowing ? window : parentRef.current;
    if (!target) return;
    return startScopedScrollFpsMonitor(target, 'NotesVirtualGrid', {
    itemCount: notes.length,
    overscan: resolvedOverscan,
    rowHeight: resolvedRowHeight,
      windowing: resolvedWindowing ? 'window' : 'container',
    });
  }, [notes.length, resolvedOverscan, resolvedRowHeight, resolvedWindowing]);

  return (
    <div
      ref={parentRef}
      data-flowist-virtual-list="notes"
      data-virt-overscan={resolvedOverscan}
      data-virt-row-height={resolvedRowHeight}
      data-virt-windowing={resolvedWindowing ? 'window' : 'container'}
      style={resolvedWindowing
        ? { position: 'relative' }
        : { position: 'relative', height: 'min(72vh, 900px)', overflow: 'auto', WebkitOverflowScrolling: 'touch', contain: 'strict' }
      }
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vrow) => {
          const row = rows[vrow.index];
          if (!row) return null;
          return (
            <div
              key={vrow.key}
              data-index={vrow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${vrow.size}px`,
                transform: `translateY(${vrow.start - (resolvedWindowing ? scrollMargin : 0)}px)`,
                paddingBottom: row.kind === 'note' && row.last ? '12px' : undefined,
              } as React.CSSProperties}
            >
              {row.kind === 'heading' ? (
                <h2 className="notes-date-heading flex h-full items-center rounded-t-lg border-x border-t border-border bg-card px-5 text-xs font-medium uppercase text-muted-foreground">{row.label}</h2>
              ) : (
                <div className={`notes-date-row relative h-full min-w-0 border-x border-border bg-card px-5 ${row.last ? 'rounded-b-lg border-b' : ''}`}>
                  {renderCard(row.note)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
