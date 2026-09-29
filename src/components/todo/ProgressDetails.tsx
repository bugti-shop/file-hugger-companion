import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, startOfDay, startOfHour, subDays, subHours, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SafeComponent } from '@/components/ErrorBoundary';
import { StreakConsistencyCertificate } from '@/components/StreakConsistencyCertificate';
import { VirtualJourneyCard } from '@/components/VirtualJourneyCard';

type ChartRange = 'today' | '24h' | '7d' | '30d' | 'month' | 'year';
type ProgressTask = { completedAt?: Date | string | null };

interface ProgressDetailsProps {
  tasks: ProgressTask[];
  currentStreak: number;
  longestStreak: number;
  lifetimeCompleted: number;
}

export default function ProgressDetails({ tasks, currentStreak, longestStreak, lifetimeCompleted }: ProgressDetailsProps) {
  const { t } = useTranslation();
  const [range, setRange] = useState<ChartRange>('7d');
  const options: { key: ChartRange; label: string }[] = [
    { key: 'today', label: t('streak.rangeToday', 'Today') },
    { key: '24h', label: t('streak.range24h', '24h') },
    { key: '7d', label: t('streak.range7d', '7 Days') },
    { key: '30d', label: t('streak.range30d', '30 Days') },
    { key: 'month', label: t('streak.rangeMonth', 'Last Month') },
    { key: 'year', label: t('streak.rangeYear', 'Last Year') },
  ];

  const data = useMemo(() => {
    const now = new Date();
    const buckets: Array<{ date: string; label: string; value: number }> = [];
    const counts = new Map<string, number>();
    const add = (date: string, label: string) => { counts.set(date, 0); buckets.push({ date, label, value: 0 }); };
    const pad = (value: number) => value < 10 ? `0${value}` : String(value);
    let mode: 'hour' | 'day' | 'month' = 'day';

    if (range === 'today') {
      mode = 'hour';
      const start = startOfDay(now);
      for (let hour = 0; hour <= now.getHours(); hour += 1) {
        const date = new Date(start); date.setHours(hour);
        add(format(startOfHour(date), 'yyyy-MM-dd HH'), format(date, 'ha'));
      }
    } else if (range === '24h') {
      mode = 'hour';
      for (let index = 23; index >= 0; index -= 1) {
        const date = subHours(now, index);
        add(format(startOfHour(date), 'yyyy-MM-dd HH'), format(date, 'ha'));
      }
    } else if (range === 'year') {
      mode = 'month';
      for (let index = 11; index >= 0; index -= 1) {
        const date = subMonths(now, index);
        add(format(date, 'yyyy-MM'), format(date, 'MMM'));
      }
    } else {
      const days = range === '7d' ? 7 : 30;
      const labelFormat = range === '7d' ? 'EEE' : 'MMM d';
      for (let index = days - 1; index >= 0; index -= 1) {
        const date = subDays(now, index);
        add(format(startOfDay(date), 'yyyy-MM-dd'), format(date, labelFormat));
      }
    }

    for (const task of tasks) {
      if (!task.completedAt) continue;
      const date = task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt);
      const month = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      const key = mode === 'month' ? month : mode === 'day'
        ? `${month}-${pad(date.getDate())}`
        : `${month}-${pad(date.getDate())} ${pad(date.getHours())}`;
      const count = counts.get(key);
      if (count !== undefined) counts.set(key, count + 1);
    }
    return buckets.map(bucket => ({ ...bucket, value: counts.get(bucket.date) || 0 }));
  }, [range, tasks]);

  return <>
    <SafeComponent fallback={null}>
      <div className="bg-card rounded-3xl p-5 sm:p-6 border shadow-sm [content-visibility:auto] [contain-intrinsic-size:360px]">
        <h3 className="mb-4 text-[17px] sm:text-[19px] font-semibold text-foreground leading-tight">{t('streak.completedTasks', 'Completed Tasks')}</h3>
        <div className="flex gap-1.5 mb-5 overflow-x-auto -mx-1 px-1 no-scrollbar">
          {options.map(option => <button key={option.key} onClick={() => setRange(option.key)} className={cn('px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors border', range === option.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted')}>{option.label}</button>)}
        </div>
        <div className="w-full h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="progressAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} tickMargin={4} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 13, color: 'hsl(var(--foreground))' }} formatter={(value: number) => [value, t('streak.tasks', 'tasks')]} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#progressAreaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SafeComponent>
    <SafeComponent fallback={null}><div className="-mx-3 sm:mx-0"><StreakConsistencyCertificate currentStreak={currentStreak} totalCompletions={lifetimeCompleted} longestStreak={longestStreak} /></div></SafeComponent>
    <SafeComponent fallback={null}><VirtualJourneyCard /></SafeComponent>
  </>;
}