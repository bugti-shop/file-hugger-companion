import { useEffect, useRef, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import type { TodoItem } from '@/types/note';

const PAGE_SIZE = 24;

interface TimelineTaskRowsProps {
  id: string;
  color: string;
  tasks: TodoItem[];
  renderTaskItem: (item: TodoItem) => React.ReactNode;
  renderSubtasksInline: (item: TodoItem) => React.ReactNode;
}

export function TimelineTaskRows({ id, color, tasks, renderTaskItem, renderSubtasksInline }: TimelineTaskRowsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const shown = Math.min(visibleCount, tasks.length);

  useEffect(() => {
    if (shown >= tasks.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) setVisibleCount(count => count + PAGE_SIZE);
    }, { rootMargin: '400px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shown, tasks.length]);

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps}
          className={cn('pb-2', snapshot.isDraggingOver && 'bg-primary/5')}>
          {tasks.slice(0, shown).map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(dragProvided, dragSnapshot) => (
                <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                  className={cn(dragSnapshot.isDragging && 'shadow-lg ring-2 ring-primary rounded-lg')}>
                  {renderTaskItem(item)}
                  {renderSubtasksInline(item)}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          {shown < tasks.length && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
        </div>
      )}
    </Droppable>
  );
}