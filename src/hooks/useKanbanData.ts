import { useState, useEffect } from "react";
import { dbClient } from "@/lib/db";
import type { Column, Task } from "@/types/kanban";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export const useKanbanData = () => {
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    const db = dbClient();
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
        })
    );
    setColumns(colsWithTasks);
    await updateCommentCounts(colsWithTasks);
  };

  const updateCommentCounts = async (cols: ColumnWithTasks[]) => {
    const db = dbClient();
    const allTasks = cols.flatMap((col) => col.tasks);
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
          : c
      )
    );
    setCommentCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const updateColumn = async (columnId: number, newTitle: string) => {
    const db = dbClient();
    await db.columns.update(columnId, { title: newTitle });
  };

  const deleteColumn = async (columnId: number) => {
    const db = dbClient();
    const column = columns.find((c) => c.id === columnId);
    if (column) {
      for (const task of column.tasks) {
        if (task.id) {
          await db.comments.where("taskId").equals(task.id).delete();
          await db.tasks.delete(task.id);
        }
      }
    }
    await db.columns.delete(columnId);
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
  };

  const deleteAllCards = async (columnId: number) => {
    const db = dbClient();
    const column = columns.find((c) => c.id === columnId);
    if (column) {
      for (const task of column.tasks) {
        if (task.id) {
          await db.comments.where("taskId").equals(task.id).delete();
          await db.tasks.delete(task.id);
        }
      }
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, tasks: [] } : c))
      );
    }
  };

  return {
    columns,
    setColumns,
    commentCounts,
    addColumn,
    addTask,
    updateColumn,
    deleteColumn,
    deleteAllCards,
    updateCommentCounts,
  };
};