import { describe, expect, it } from 'vitest';
import { getNotesDateGroup } from '@/components/notes/NotesVirtualGrid';

describe('Notes date group headings', () => {
  const now = new Date(2026, 9, 15, 12);

  it('places recent notes into Today, Yesterday and This week', () => {
    expect(getNotesDateGroup(new Date(2026, 9, 15, 8), now).label).toBe('Today');
    expect(getNotesDateGroup(new Date(2026, 9, 14, 22), now).label).toBe('Yesterday');
    expect(getNotesDateGroup(new Date(2026, 9, 12, 10), now).label).toBe('This week');
  });

  it('names other months and adds the year to older notes', () => {
    expect(getNotesDateGroup(new Date(2026, 8, 8), now)).toEqual({ key: '2026-09', label: 'September' });
    expect(getNotesDateGroup(new Date(2025, 2, 8), now)).toEqual({ key: '2025-03', label: 'March 2025' });
  });

  it('falls back gracefully for an invalid date', () => {
    expect(getNotesDateGroup('not a date', now).label).toBe('Earlier');
  });
});