"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";

const COLS = [
  { id: "todo", label: "Pending", color: "border-t-amber-400" },
  { id: "in_progress", label: "In progress", color: "border-t-blue-500" },
  { id: "done", label: "Completed", color: "border-t-emerald-500" },
];

export default function KanbanBoard({ tasks, onMove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const [activeId, setActiveId] = useState(null);
  const grouped = COLS.map((c) => ({
    ...c,
    items: tasks.filter((t) => t.status === c.id),
  }));

  const active = activeId ? tasks.find((t) => t._id === activeId) : null;

  function handleDragEnd(e) {
    setActiveId(null);
    if (!e.over) return;
    const overCol = e.over.id;
    const taskId = e.active.id;
    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== overCol) onMove(task, overCol);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grouped.map((col) => (
          <Column key={col.id} col={col} />
        ))}
      </div>
      <DragOverlay>
        {active && <Card task={active} dragging />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ col }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl shadow-card overflow-hidden border-t-4 ${col.color} ${
        isOver ? "ring-2 ring-brand-400" : ""
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-sm">{col.label}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {col.items.length}
        </span>
      </div>
      <div className="p-3 space-y-2 min-h-[300px] max-h-[calc(100vh-280px)] overflow-auto thin-scroll">
        {col.items.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">
            Drop tasks here
          </p>
        )}
        {col.items.map((t) => (
          <DraggableCard key={t._id} task={t} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ task }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: task._id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    >
      <Card task={task} />
    </div>
  );
}

function Card({ task, dragging }) {
  const overdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate) < new Date();
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 text-sm border ${
        dragging
          ? "border-brand-500 shadow-lg"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <Link
        href={`/tasks/${task._id}`}
        className="font-medium block hover:text-brand-600 line-clamp-2"
      >
        {task.title}
      </Link>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <StatusBadge kind="priority" value={task.priority} />
        {task.project && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">
            {task.project.name}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {task.assignedTo && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Avatar name={task.assignedTo.name} size={20} />
            <span className="truncate max-w-[80px]">
              {task.assignedTo.name}
            </span>
          </div>
        )}
        {task.dueDate && (
          <span
            className={`text-[11px] ${overdue ? "text-rose-600 font-medium" : "text-slate-500"}`}
          >
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      {task.blockedBy?.length > 0 && (
        <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
          🔒 Blocked by {task.blockedBy.length}
        </div>
      )}
    </div>
  );
}
