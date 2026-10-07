import { getTextPreviewFromHtml } from '@/utils/contentPreview';
import type { Note } from '@/types/note';

/** Keep original complete sentences, never arbitrary word slices or ellipses. */
export const getNoteCardPreview = (note: Note): string => {
  const raw = note.content || (note as Note & { __contentPreview?: string }).__contentPreview || '';
  const text = getTextPreviewFromHtml(raw.replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, ' '), 4000)
    .replace(/\.{2,}|…/g, '').trim();
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?](?:["”’])?/g) ?? [];
  const short = sentences.map(sentence => sentence.trim()).filter(sentence => sentence.length <= 140);
  if (short.length) return short.sort((a, b) => a.length - b.length)[0];
  // Unpunctuated short notes are shown whole, not cut into a fabricated sentence.
  const metadata = note as Note & { __contentStub?: boolean; __contentLength?: number };
  const isTruncated = metadata.__contentStub && (metadata.__contentLength ?? 0) > raw.length;
  if (!sentences.length && !isTruncated && raw.length < 4000 && text.length <= 140) return text;
  return '';
};