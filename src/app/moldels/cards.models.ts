export interface Card {
  id: string;
  content: string;
  column: 'went-well' | 'to-improve' | 'action-items';
  votes: number;
  createdAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  hasFinished: boolean;
  joinedAt: Date;
}

export interface BoardSession {
  id: string;
  name: string;
  cards: Card[];
  participants: Participant[];
  isRevealed: boolean;
  createdAt: Date;
  createdBy: string;
}
