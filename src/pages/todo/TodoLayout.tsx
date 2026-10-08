import { ReactNode, startTransition } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, X, Crown, Folder } from 'lucide-react';
import { NotificationCenter } from '@/components/NotificationCenter';
import { FeatureGuideButton } from '@/components/tours/FeatureGuideModal';
import { TodoBottomNavigation } from '@/components/TodoBottomNavigation';
import { DashboardGlassActions } from '@/components/DashboardGlassActions';

import { AppLogo } from '@/components/AppLogo';
import { triggerHaptic } from '@/utils/haptics';
import { prefetchRoute } from '@/utils/routePrefetch';


interface TodoLayoutProps {
  children: ReactNode;
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  inboxDashboard?: boolean;
}

export const TodoLayout = ({ children, title, searchValue, onSearchChange, inboxDashboard = false }: TodoLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();


  return (
    <div className={inboxDashboard ? 'todo-dashboard-shell min-h-screen bg-tasks-bg' : 'min-h-screen bg-background'}>
      <div className="flex-1 min-w-0 flex flex-col">
      <header 
        className={inboxDashboard ? 'sticky top-0 bg-tasks-bg z-30' : 'sticky top-0 bg-background z-30'}
        style={{
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          paddingTop: 'var(--safe-top, 0px)', paddingLeft: 'var(--safe-left, 0px)', paddingRight: 'var(--safe-right, 0px)',
        }}
      >
        <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-1.5 pb-1">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <div className={inboxDashboard ? 'flex items-center gap-2' : 'md:hidden flex items-center gap-2'}>
                {inboxDashboard ? <Folder className="h-6 w-6 text-foreground" /> : <AppLogo />}
              </div>
              <h1 className={inboxDashboard ? 'text-xl font-bold truncate' : 'text-lg sm:text-xl lg:text-2xl font-bold truncate md:hidden'}>{inboxDashboard ? t('folders.inbox', 'Inbox') : title}</h1>
            </div>
            <div className="flex items-center flex-shrink-0">
              <FeatureGuideButton className="hidden" />
              <DashboardGlassActions targetId="todo-header-options">

              <Button
                size="icon"
                variant="ghost"
                onPointerDown={() => {
                  // Kick off prefetch on pointer-down so the chunk is warm by the time click fires
                  void prefetchRoute('/notesdashboard');
                }}
                onClick={() => {
                  // Navigate synchronously first for instant route swap; defer side-effects
                  navigate('/notesdashboard');
                  // Non-blocking side effects
                  Promise.resolve().then(() => {
                    triggerHaptic('heavy').catch(() => {});
                  });
                }}
                className="dashboard-glass-action"
                title={t('common.switchToNotes')}
                data-tour="switch-to-notes"
              >
                <FileText className="dashboard-glass-icon" strokeWidth={2.1} />
              </Button>
              </DashboardGlassActions>
            </div>
          </div>

          {!inboxDashboard && <div className="relative" data-tour="todo-search-bar">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('tasks.searchTasks', 'Search tasks')}
              className="pl-10 pr-10 bg-secondary border-none text-sm sm:text-base shadow-sm"
              value={searchValue || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>}
        </div>
        {!inboxDashboard && <div className="h-[1px] bg-border" />}
      </header>
      <main className="pb-14 md:pb-4">
        <div className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {children}
        </div>
        <div className="text-center py-2">
          <Link to="/privacy-policy" className="text-[10px] text-background hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          <span className="text-[10px] text-background mx-1">·</span>
          <Link to="/terms-and-conditions" className="text-[10px] text-background hover:text-muted-foreground transition-colors">Terms</Link>
        </div>
      </main>
      <div className="md:hidden">
        <TodoBottomNavigation />
      </div>
      </div>
    </div>
  );
};
