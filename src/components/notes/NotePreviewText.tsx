import { useLayoutEffect, useRef, useState } from 'react';

/** A sentence is either visible in full or omitted; no clipping or ellipsis. */
export function NotePreviewText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setFits(element.scrollWidth <= element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [text]);
  return <span ref={ref} aria-hidden={!fits} className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[13px] ${fits ? '' : 'invisible'}`}>{text}</span>;
}