"use client";

import React, { useState } from "react";
import { DndContext, DragOverlay, rectIntersection } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import CardWrapper from "@/components/modules/CardWrapper";
import SortableColumn from "@/components/modules/SortableColumn";
import ColumnMenu from "@/components/modules/ColumnMenu";
import CommentsModal from "@/components/modules/CommentsModal";
import DragOverlayContent from "@/components/modules/DragOverlayContent";
import { useKanbanData } from "@/hooks/useKanbanData";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import styles from "@/assets/css/page.module.css";

const HomePage = () => {
  const {
    columns,
    setColumns,
    commentCounts,
    addColumn,
    addTask,
    updateColumn,
    deleteColumn,
    deleteAllCards,
    updateCommentCounts,
  } = useKanbanData();

  const { sensors, activeColumn, activeTask, handleDragStart, handleDragEnd } =
    useDragAndDrop(columns, setColumns);

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>("");
  const [menuColumnId, setMenuColumnId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

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

        {menuColumnId && menuPosition && (
          <ColumnMenu
            isOpen={true}
            position={menuPosition}
            onClose={() => setMenuColumnId(null)}
            onDeleteList={() => {
              deleteColumn(menuColumnId);
              setMenuColumnId(null);
            }}
            onDeleteAllCards={() => {
              deleteAllCards(menuColumnId);
              setMenuColumnId(null);
            }}
          />
        )}

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
        <DragOverlayContent
          activeColumn={activeColumn}
          activeTask={activeTask}
          commentCounts={commentCounts}
        />
      </DragOverlay>
    </DndContext>
  );
};

export default HomePage;