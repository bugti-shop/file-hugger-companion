import { getTextPreviewFromHtml } from '@/utils/contentPreview';
import type { Note } from '@/types/note';

/** A stable, short preview for both Notes dashboards and Calendar cards. */
export const getNoteCardPreview = (note: Note): string => {
  const raw = (note as Note & { __contentPreview?: string }).__contentPreview || note.content || '';
  const text = getTextPreviewFromHtml(raw, 240).replace(/\.{2,}\s*$/, '').trim();
  if (!text) return '';
  const words = text.split(/\s+/);
  const hash = Array.from(note.id).reduce((value, char) => ((value * 31 + char.charCodeAt(0)) >>> 0), 0);
  return words.slice(0, 3 + hash % 3).join(' ');
};