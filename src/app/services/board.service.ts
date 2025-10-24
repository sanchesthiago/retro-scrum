import { Injectable, inject } from '@angular/core';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private wsService = inject(WebsocketService);

  // ✅ Apenas repassa os signals
  public currentSession = this.wsService.currentSession;
  public currentParticipant = this.wsService.currentParticipant;
  public connectionStatus = this.wsService.connectionStatus;

  createSession(sessionName: string, userName: string): void {
    this.wsService.createSession(sessionName, userName);
  }

  joinSession(sessionId: string, userName: string): void {
    this.wsService.joinSession(sessionId, userName);
  }

  addCard(content: string, column: string): void {
    this.wsService.addCard(content, column);
  }

  markAsFinished(): void {
    this.wsService.markFinished();
  }

  revealCards(): void {
    this.wsService.revealCards();
  }

  voteCard(cardId: string): void {
    this.wsService.voteCard(cardId);
  }

  deleteCard(cardId: string): void {
    this.wsService.deleteCard(cardId);
  }

  leaveSession(): void {
    this.wsService.leaveSession();
  }
}
