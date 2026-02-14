"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RxDotsHorizontal } from "react-icons/rx";
import type { Column, Task } from "@/types/kanban";
import SortableTask from "./SortableTask";
import TaskAdder from "./TaskAdder";
import styles from "@/assets/css/page.module.css";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

interface SortableColumnProps {
  column: ColumnWithTasks;
  commentCounts: Record<number, number>;
  onUpdateColumn: (columnId: number, newTitle: string) => void;
  onAddTask: (columnId: number, title: string) => void;
  onOpenComments: (taskId: number, taskTitle: string) => void;
  onOpenMenu: (columnId: number, event: React.MouseEvent) => void;
  setColumns: React.Dispatch<React.SetStateAction<ColumnWithTasks[]>>;
}

const SortableColumn: React.FC<SortableColumnProps> = ({
  column,
  commentCounts,
  onUpdateColumn,
  onAddTask,
  onOpenComments,
  onOpenMenu,
  setColumns,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id!}`,
    data: {
      type: "column",
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskIds = column.tasks.map((task) => `task-${task.id!}`);

  return (
    <div ref={setNodeRef} style={style}>
      <div className={styles.cards} {...attributes} {...listeners}>
        <div className={styles.titleWrap}>
          <input
            className={styles.wrapperTitle}
            value={column.title}
            onChange={(e) =>
              setColumns((prev) =>
                prev.map((c) =>
                  c.id === column.id ? { ...c, title: e.target.value } : c,
                ),
              )
            }
            onBlur={(e) => {
              if (column.id) {
                onUpdateColumn(column.id, e.target.value);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <button
            className={styles.dotsBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(column.id!, e);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <RxDotsHorizontal color="black" />
          </button>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div style={{ minHeight: "10px" }}>
              {column.tasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  commentCounts={commentCounts}
                  onOpenComments={onOpenComments}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()}>
          <TaskAdder onAdd={(title) => onAddTask(column.id!, title)} />
        </div>
      </div>
    </div>
  );
};

export default SortableColumn;