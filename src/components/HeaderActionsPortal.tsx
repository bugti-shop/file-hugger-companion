import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const HeaderActionsPortal = ({ targetId, children }: { targetId: string; children: ReactNode }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById(targetId));
  }, [targetId]);
  return target ? createPortal(children, target) : null;
};