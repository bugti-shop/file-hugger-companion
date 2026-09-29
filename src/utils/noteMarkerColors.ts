/** Small, named palette for the note-list edge marker; independent of note paper color. */
export const NOTE_MARKER_COLORS = [
  { name: 'Red', value: 'hsl(var(--note-mark-red))' },
  { name: 'Orange', value: 'hsl(var(--note-mark-orange))' },
  { name: 'Yellow', value: 'hsl(var(--note-mark-yellow))' },
  { name: 'Green', value: 'hsl(var(--note-mark-green))' },
  { name: 'Teal', value: 'hsl(var(--note-mark-teal))' },
  { name: 'Blue', value: 'hsl(var(--note-mark-blue))' },
  { name: 'Indigo', value: 'hsl(var(--note-mark-indigo))' },
  { name: 'Purple', value: 'hsl(var(--note-mark-purple))' },
  { name: 'Pink', value: 'hsl(var(--note-mark-pink))' },
  { name: 'Gray', value: 'hsl(var(--note-mark-gray))' },
] as const;

export type NoteMarkerColor = (typeof NOTE_MARKER_COLORS)[number]['name'];

export const getNoteMarkerColor = (name?: string) =>
  NOTE_MARKER_COLORS.find((color) => color.name === name)?.value;