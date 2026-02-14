export interface Board {
  id?: number;
  title: string;
  createdAt: number;
}

export interface Column {
  id?: number;
  boardId: number;
  title: string;
  order: number;
}

export interface Task {
  id?: number;
  columnId: number;
  title: string;
  order: number;
  createdAt: number;
}

export interface Comment {
  id?: number;
  taskId: number;
  content: string;
  createdAt: number;
}
