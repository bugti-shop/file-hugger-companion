import type { TaskSection } from '@/types/note';

/** The old built-in placeholder is not a user-created section. */
export const getUserTaskSections = (sections: TaskSection[]): TaskSection[] =>
  sections.filter(section => section.id !== 'default');

/** A task stays unsectioned unless a real section was explicitly chosen. */
export const resolveTaskSection = (sections: TaskSection[], ...choices: (string | null | undefined)[]): string | undefined =>
  choices.find(id => Boolean(id && sections.some(section => section.id === id && id !== 'default'))) || undefined;