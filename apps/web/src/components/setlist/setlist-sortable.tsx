"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquare, Music, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SetlistItemKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface SetlistSortableRow {
  id: string;
  kind: SetlistItemKind;
  songId?: string;
  title: string;
  artist?: string;
  notes?: string;
}

interface SetlistSortableProps {
  items: SetlistSortableRow[];
  onReorder: (orderedIds: string[]) => void;
  onRemove: (id: string) => void;
}

function SortableRow({
  item,
  onRemove,
}: {
  item: SetlistSortableRow;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isMarker = item.kind === "marker";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        isMarker ? "border-dashed bg-muted/40" : "bg-card",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          isMarker ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-primary/10 text-primary"
        )}
      >
        {isMarker ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          <Music className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        {item.artist && (
          <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
        )}
        {item.notes && (
          <p className="text-xs text-muted-foreground italic truncate">{item.notes}</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SetlistSortable({ items, onReorder, onRemove }: SetlistSortableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((i) => i.id));
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Cette setlist est vide. Ajoutez des chansons ou des sections (pause, annonce…).
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableRow key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
