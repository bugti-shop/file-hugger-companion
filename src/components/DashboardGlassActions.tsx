import type { ReactNode } from 'react';

/** Keeps the dashboard switcher and the portaled options menu in one control. */
export const DashboardGlassActions = ({ targetId, children }: { targetId: string; children: ReactNode }) => (
  <div className="dashboard-glass-actions" role="group">
    {children}
    <div id={targetId} className="dashboard-glass-menu-slot" />
  </div>
);