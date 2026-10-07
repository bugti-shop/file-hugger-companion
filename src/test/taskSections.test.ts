import { describe, expect, it } from 'vitest';
import { getUserTaskSections, resolveTaskSection } from '@/utils/taskSections';
import { DEFAULT_PRIORITIES } from '@/utils/priorityStorage';

const section = { id: 'chosen', name: 'Work', color: '', order: 0, isCollapsed: false };
describe('user-chosen task sections', () => {
  it('does not create a section for a new library', () => expect(getUserTaskSections([])).toEqual([]));
  it('removes only the old automatic placeholder', () => expect(getUserTaskSections([{ ...section, id: 'default', name: 'Tasks' }, section])).toEqual([section]));
  it('does not assign the first section automatically', () => expect(resolveTaskSection([section])).toBeUndefined());
  it('retains an explicitly chosen section', () => expect(resolveTaskSection([section], 'chosen')).toBe('chosen'));
  it('does not restore the old default section', () => expect(resolveTaskSection([section], 'default')).toBeUndefined());
  it('uses blue rather than green for Low priority', () => expect(DEFAULT_PRIORITIES.find(p => p.id === 'low')?.color).toBe('#3B82F6'));
});