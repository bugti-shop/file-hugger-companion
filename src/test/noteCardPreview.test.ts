import { describe, expect, it } from 'vitest';
import { getNoteCardPreview } from '@/utils/noteCardPreview';
import type { Note } from '@/types/note';

const makeNote = (content: string): Note => ({ id: 'sample', content, type: 'regular', title: 'Test', voiceRecordings: [], createdAt: new Date(), updatedAt: new Date() });
const preview = (content: string) => getNoteCardPreview(makeNote(content));
describe('complete Notes previews', () => {
  it('keeps a complete sentence instead of a random word slice', () => {
    expect(preview('<p>Education helps us grow.</p><p>Learning builds a brighter future.</p>')).toBe('Education helps us grow.');
  });
  it('does not use a truncated cached preview over the full note', () => {
    const note = { ...makeNote('Life matters.'), __contentPreview: 'Life mat...' };
    expect(getNoteCardPreview(note)).toBe('Life matters.');
  });
  it('shows short unpunctuated notes whole', () => expect(preview('Buy milk')).toBe('Buy milk'));
  it('never returns a partial long sentence', () => expect(preview('Learning '.repeat(80) + 'matters.')).toBe(''));
  it('removes ellipses', () => expect(preview('We can do it...')).not.toMatch(/\.{2,}|…/));
});