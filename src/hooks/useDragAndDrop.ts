import { useState } from "react";
import { DragStartEvent, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { dbClient } from "@/lib/db";
import type { Column, Task } from "@/types/kanban";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

export const useDragAndDrop = (
  columns: ColumnWithTasks[],
  setColumns: React.Dispatch<React.SetStateAction<ColumnWithTasks[]>>
) => {
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { type } = active.data.current || {};

    if (type === "column") {
      const columnId = parseInt(active.id.toString().replace("column-", ""));
      const column = columns.find((col) => col.id === columnId);
      if (column) setActiveColumn(column);
    } else if (type === "task") {
      const taskId = parseInt(active.id.toString().replace("task-", ""));
      const task = columns.flatMap((col) => col.tasks).find((t) => t.id === taskId);
      if (task) setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveColumn(null);
    setActiveTask(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    // Handle column reordering
    if (activeType === "column") {
      const activeId = parseInt(active.id.toString().replace("column-", ""));
      const overId = parseInt(over.id.toString().replace("column-", ""));

      if (activeId === overId) return;

      const oldIndex = columns.findIndex((col) => col.id === activeId);
      const newIndex = columns.findIndex((col) => col.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedColumns = arrayMove(columns, oldIndex, newIndex);
      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      setColumns(updatedColumns);

      const db = dbClient();
      for (const col of updatedColumns) {
        if (col.id) {
          await db.columns.update(col.id, { order: col.order });
        }
      }
      return;
    }

    // Handle task movement
    if (activeType === "task") {
      const activeTaskId = parseInt(active.id.toString().replace("task-", ""));

      let sourceColumn: ColumnWithTasks | undefined;
      let sourceTaskIndex = -1;

      for (const col of columns) {
        const idx = col.tasks.findIndex((t) => t.id === activeTaskId);
        if (idx !== -1) {
          sourceColumn = col;
          sourceTaskIndex = idx;
          break;
        }
      }

      if (!sourceColumn) return;

      const overIdStr = over.id.toString();
      let targetColumn: ColumnWithTasks | undefined;
      let targetTaskIndex = -1;

      if (overIdStr.startsWith("task-")) {
        const overTaskId = parseInt(overIdStr.replace("task-", ""));
        for (const col of columns) {
          const idx = col.tasks.findIndex((t) => t.id === overTaskId);
          if (idx !== -1) {
            targetColumn = col;
            targetTaskIndex = idx;
            break;
          }
        }
      } else if (overIdStr.startsWith("column-")) {
        const overColumnId = parseInt(overIdStr.replace("column-", ""));
        targetColumn = columns.find((col) => col.id === overColumnId);
        if (targetColumn) {
          targetTaskIndex = targetColumn.tasks.length;
        }
      }

      if (!targetColumn) return;

      const db = dbClient();

      if (sourceColumn.id === targetColumn.id) {
        if (sourceTaskIndex === targetTaskIndex) return;

        const reorderedTasks = arrayMove(
          sourceColumn.tasks,
          sourceTaskIndex,
          targetTaskIndex
        );

        for (let i = 0; i < reorderedTasks.length; i++) {
          const taskId = reorderedTasks[i].id;
          if (taskId !== undefined) {
            await db.tasks.update(taskId, { order: i });
            reorderedTasks[i].order = i;
          }
        }

        setColumns((prev) =>
          prev.map((col) =>
            col.id === sourceColumn.id ? { ...col, tasks: reorderedTasks } : col
          )
        );
      } else {
        const sourceTask = sourceColumn.tasks[sourceTaskIndex];
        const newSourceTasks = sourceColumn.tasks.filter(
          (t) => t.id !== activeTaskId
        );
        const newTargetTasks = [...targetColumn.tasks];
        newTargetTasks.splice(targetTaskIndex, 0, sourceTask);

        for (let i = 0; i < newSourceTasks.length; i++) {
          const taskId = newSourceTasks[i].id;
          if (taskId !== undefined) {
            await db.tasks.update(taskId, { order: i });
            newSourceTasks[i].order = i;
          }
        }

        for (let i = 0; i < newTargetTasks.length; i++) {
          const taskId = newTargetTasks[i].id;
          if (taskId !== undefined) {
            await db.tasks.update(taskId, {
              columnId: targetColumn.id!,
              order: i,
            });
            newTargetTasks[i].columnId = targetColumn.id!;
            newTargetTasks[i].order = i;
          }
        }

        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === sourceColumn.id) {
              return { ...col, tasks: newSourceTasks };
            }
            if (col.id === targetColumn.id) {
              return { ...col, tasks: newTargetTasks };
            }
            return col;
          })
        );
      }
    }
  };

  return {
    sensors,
    activeColumn,
    activeTask,
    handleDragStart,
    handleDragEnd,
  };
};