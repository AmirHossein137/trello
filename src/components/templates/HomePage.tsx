"use client";

import React, { useEffect, useState } from "react";
import CardWrapper from "@/components/modules/CardWrapper";
import TaskAdder from "@/components/modules/TaskAdder";
import ColumnMenu from "@/components/modules/ColumnMenu";
import { dbClient } from "@/lib/db";
import type { Column, Task } from "@/types/kanban";
import styles from "@/assets/css/page.module.css";
import { RxDotsHorizontal } from "react-icons/rx";
import CommentsModal from "../modules/CommentsModal";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

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

const HomePage = () => {
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>("");
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Column menu state
  const [menuColumnId, setMenuColumnId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
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
      await updateCommentCounts(colsWithTasks);
    };

    fetchColumns();
  }, []);

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
          : c,
      ),
    );
    setCommentCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const updateColumn = async (columnId: number, newTitle: string) => {
    const db = dbClient();
    await db.columns.update(columnId, { title: newTitle });
  };

  const deleteColumn = async (columnId: number) => {
    const db = dbClient();
    
    // Delete all tasks and their comments
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
    setMenuColumnId(null);
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
    
    setMenuColumnId(null);
  };

  const openCommentsModal = (taskId: number, taskTitle: string) => {
    setActiveTaskId(taskId);
    setActiveTaskTitle(taskTitle);
  };

  const handleCloseModal = async () => {
    setActiveTaskId(null);
    setActiveTaskTitle("");
    await updateCommentCounts(columns);
  };

  const handleOpenMenu = (columnId: number, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 5,
      left: rect.left + 8,
    });
    setMenuColumnId(columnId);
  };

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

        // Update orders in database
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

        // Update source tasks orders
        for (let i = 0; i < newSourceTasks.length; i++) {
          const taskId = newSourceTasks[i].id;
          if (taskId !== undefined) {
            await db.tasks.update(taskId, { order: i });
            newSourceTasks[i].order = i;
          }
        }

        // Update target tasks orders and columnId
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

  const columnIds = columns.map((col) => `column-${col.id!}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Demo Board</h1>
        <div className={styles.itemWrapper}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((col) => (
              <SortableColumn
                key={col.id}
                column={col}
                commentCounts={commentCounts}
                onUpdateColumn={updateColumn}
                onAddTask={addTask}
                onOpenComments={openCommentsModal}
                onOpenMenu={handleOpenMenu}
                setColumns={setColumns}
              />
            ))}
          </SortableContext>
          <CardWrapper onAdd={addColumn} />
        </div>
        
        {/* Column Menu */}
        {menuColumnId && menuPosition && (
          <ColumnMenu
            isOpen={true}
            position={menuPosition}
            onClose={() => setMenuColumnId(null)}
            onDeleteList={() => deleteColumn(menuColumnId)}
            onDeleteAllCards={() => deleteAllCards(menuColumnId)}
          />
        )}

        {/* Comments Modal */}
        {activeTaskId !== null && (
          <CommentsModal
            taskId={activeTaskId}
            taskTitle={activeTaskTitle}
            isOpen={true}
            onClose={handleCloseModal}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeColumn ? (
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
        ) : activeTask ? (
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
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default HomePage;