export interface Board {
  id: string;
  title: string;
  columns: Column[];
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  cards: Card[];
}

export interface Card {
  id: string;
  content: string;
  votes: number;
  columnId: string;
}
