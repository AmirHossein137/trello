"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/kanban";
import styles from "@/assets/css/page.module.css";

interface SortableTaskProps {
  task: Task;
  commentCounts: Record<number, number>;
  onOpenComments: (taskId: number, taskTitle: string) => void;
}

const SortableTask: React.FC<SortableTaskProps> = ({
  task,
  commentCounts,
  onOpenComments,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id!}`,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.taskWrapper}
    >
      <h3>{task.title}</h3>
      <div className={styles.commentsWrap}>
        <button
          className={styles.comments}
          onClick={() => onOpenComments(task.id!, task.title)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Comments ({commentCounts[task.id!] || 0})
        </button>
      </div>
    </div>
  );
};

export default SortableTask;