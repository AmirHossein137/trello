"use client";

import React, { useEffect, useState } from "react";
import CardWrapper from "@/components/modules/CardWrapper";
import TaskAdder from "@/components/modules/TaskAdder";
import { dbClient } from "@/lib/db";
import type { Column, Task } from "@/types/kanban";
import styles from "@/app/page.module.css";
import { RxDotsHorizontal } from "react-icons/rx";
import CommentsModal from "../modules/CommentsModal";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

const HomePage = () => {
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>("");
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>(
    {},
  );

  useEffect(() => {
    const db = dbClient();

    const fetchColumns = async () => {
      const cols = await db.columns.toArray();
      const colsWithTasks = await Promise.all(
        cols
          .sort((a, b) => a.order - b.order)
          .map(async (col) => {
            const tasks = await db.tasks
              .where("columnId")
              .equals(col.id!)
              .sortBy("order");
            return { ...col, tasks };
          }),
      );
      setColumns(colsWithTasks);

      // Fetch comment counts for all tasks
      await updateCommentCounts();
    };

    fetchColumns();
  }, []);

  const updateCommentCounts = async () => {
    const db = dbClient();
    const allTasks = columns.flatMap((col) => col.tasks);
    const counts: Record<number, number> = {};

    for (const task of allTasks) {
      if (task.id) {
        const commentCount = await db.comments
          .where("taskId")
          .equals(task.id)
          .count();
        counts[task.id] = commentCount;
      }
    }

    setCommentCounts(counts);
  };

  const addColumn = async (title: string) => {
    const db = dbClient();
    const order = columns.length
      ? Math.max(...columns.map((c) => c.order)) + 1
      : 0;
    const newColumn: Column = { boardId: 1, title, order };
    const id = await db.columns.add(newColumn);
    setColumns((prev) => [...prev, { ...newColumn, id, tasks: [] }]);
  };

  const addTask = async (columnId: number, title: string) => {
    const db = dbClient();
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    const order = column.tasks.length
      ? Math.max(...column.tasks.map((t) => t.order)) + 1
      : 0;
    const newTask: Task = { columnId, title, order, createdAt: Date.now() };
    const id = await db.tasks.add(newTask);
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId
          ? { ...c, tasks: [...c.tasks, { ...newTask, id }] }
          : c,
      ),
    );
    setCommentCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const updateColumn = async (columnId: number, newTitle: string) => {
    const db = dbClient();
    await db.columns.update(columnId, { title: newTitle });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c)),
    );
  };

  const openCommentsModal = (taskId: number, taskTitle: string) => {
    setActiveTaskId(taskId);
    setActiveTaskTitle(taskTitle);
  };

  const handleCloseModal = async () => {
    setActiveTaskId(null);
    setActiveTaskTitle("");
    // Update comment counts after closing modal
    await updateCommentCounts();
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Demo Board</h1>
      <div className={styles.itemWrapper}>
        {columns.map((col) => (
          <div key={col.id} className={styles.cards}>
            <div className={styles.titleWrap}>
              <input
                className={styles.wrapperTitle}
                value={col.title}
                onChange={(e) =>
                  setColumns((prev) =>
                    prev.map((c) =>
                      c.id === col.id ? { ...c, title: e.target.value } : c,
                    ),
                  )
                }
                onBlur={(e) => {
                  if (col.id) {
                    updateColumn(col.id, e.target.value);
                  }
                }}
              />
              <button className={styles.dotsBtn}>
                <RxDotsHorizontal color="black" />
              </button>
            </div>
            {col.tasks.map((task) => (
              <div className={styles.taskWrapper} key={task.id}>
                <h3>{task.title}</h3>
                <div className={styles.commentsWrap}>
                  <button
                    className={styles.comments}
                    onClick={() => openCommentsModal(task.id!, task.title)}
                  >
                    Comments ({commentCounts[task.id!] || 0})
                  </button>
                </div>
              </div>
            ))}
            <TaskAdder onAdd={(title) => addTask(col.id!, title)} />
          </div>
        ))}
        <CardWrapper onAdd={addColumn} />
      </div>
      {activeTaskId !== null && (
        <CommentsModal
          taskId={activeTaskId}
          taskTitle={activeTaskTitle}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default HomePage;
