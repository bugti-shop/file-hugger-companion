import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadNoteFromDB } from '@/utils/noteStorage';
import { getNoteCardPreview } from '@/utils/noteCardPreview';

/** A sentence is either visible in full or omitted; no clipping or ellipsis. */
export function NotePreviewText({ text, noteId }: { text: string; noteId?: string }) {
  const [restored, setRestored] = useState('');
  useEffect(() => {
    setRestored('');
    if (text || !noteId) return;
    let active = true;
    void loadNoteFromDB(noteId).then(note => {
      if (active && note) setRestored(getNoteCardPreview(note));
    }).catch(() => {});
    return () => { active = false; };
  }, [text, noteId]);
  const preview = text || restored;
  const ref = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setFits(element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [preview]);
  return <span ref={ref} aria-hidden={!fits} className={`min-w-0 flex-1 max-h-6 overflow-hidden text-[12px] leading-3 ${fits ? '' : 'invisible'}`}>{preview}</span>;
}