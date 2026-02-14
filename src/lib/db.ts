import Dexie, { Table } from "dexie";
import type { Board, Column, Task, Comment } from "@/types/kanban";

export class KanbanDB extends Dexie {
  boards!: Table<Board, number>;
  columns!: Table<Column, number>;
  tasks!: Table<Task, number>;
  comments!: Table<Comment, number>;

  constructor() {
    super("KanbanDB");

    this.version(1).stores({
      boards: "++id, title, createdAt",
      columns: "++id, boardId, order",
      tasks: "++id, columnId, order, createdAt",
      comments: "++id, taskId, createdAt",
    });
  }
}

export const dbClient = () => new KanbanDB();
