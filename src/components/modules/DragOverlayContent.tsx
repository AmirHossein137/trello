"use client";

import React from "react";
import { RxDotsHorizontal } from "react-icons/rx";
import type { Column, Task } from "@/types/kanban";
import styles from "@/assets/css/page.module.css";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

interface DragOverlayContentProps {
  activeColumn: ColumnWithTasks | null;
  activeTask: Task | null;
  commentCounts: Record<number, number>;
}

const DragOverlayContent: React.FC<DragOverlayContentProps> = ({
  activeColumn,
  activeTask,
  commentCounts,
}) => {
  if (activeColumn) {
    return (
      <div className={styles.cards} style={{ opacity: 0.9, cursor: "grabbing" }}>
        <div className={styles.titleWrap}>
          <input
            className={styles.wrapperTitle}
            value={activeColumn.title}
            readOnly
          />
          <button className={styles.dotsBtn}>
            <RxDotsHorizontal color="black" />
          </button>
        </div>
        {activeColumn.tasks.map((task) => (
          <div className={styles.taskWrapper} key={task.id}>
            <h3>{task.title}</h3>
          </div>
        ))}
      </div>
    );
  }

  if (activeTask) {
    return (
      <div
        className={styles.taskWrapper}
        style={{ opacity: 0.9, cursor: "grabbing", transform: "rotate(5deg)" }}
      >
        <h3>{activeTask.title}</h3>
        <div className={styles.commentsWrap}>
          <button className={styles.comments}>
            Comments ({commentCounts[activeTask.id!] || 0})
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DragOverlayContent;