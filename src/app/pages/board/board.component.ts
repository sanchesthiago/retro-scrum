import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { BoardService } from '../../services/board.service';
import {Card} from '../../moldels/cards.models';
import {ColumnComponent} from '../column/column.component';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  imports: [
    ColumnComponent
  ],
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnDestroy {
  private boardService = inject(BoardService);

  session = this.boardService.currentSession;
  currentParticipant = this.boardService.currentParticipant;
  connectionStatus = this.boardService.connectionStatus;

  isFinishing = signal(false);
  isRevealing = signal(false);

  columns = [
    { title: '✅ Foi bom', type: 'went-well' as const, color: '#4CAF50' },
    { title: '🔄 A melhorar', type: 'to-improve' as const, color: '#FF9800' },
    { title: '🎯 Ações', type: 'action-items' as const, color: '#2196F3' }
  ];

  private connectionEffect = effect(() => {
    const status = this.connectionStatus();
    const session = this.session();

    if (status === 'connected' && session) {
      console.log('✅ Reconectado - Sincronizando sessão...');
    }
  });

  markAsFinished(): void {
    if (this.connectionStatus() !== 'connected') return;

    this.isFinishing.set(true);
    this.boardService.markAsFinished();

    setTimeout(() => this.isFinishing.set(false), 1000);
  }

  revealCards(): void {
    if (this.connectionStatus() !== 'connected') return;

    this.isRevealing.set(true);
    this.boardService.revealCards();

    setTimeout(() => this.isRevealing.set(false), 1000);
  }

  getCardsByColumn(columnType: Card['column']): Card[] {
    return this.session()?.cards.filter(card => card.column === columnType) || [];
  }

  getFinishedCount(): number {
    return this.session()?.participants.filter(p => p.hasFinished).length || 0;
  }

  getTotalParticipants(): number {
    return this.session()?.participants.length || 0;
  }

  hasCurrentUserFinished(): boolean {
    const participantName = this.currentParticipant();
    if (!participantName) return false;

    return this.session()?.participants.find(p => p.name === participantName)?.hasFinished || false;
  }

  allUsersFinished(): boolean {
    return this.getFinishedCount() === this.getTotalParticipants();
  }

  canAddCards(): boolean {
    return !this.hasCurrentUserFinished() && !this.session()?.isRevealed || false;
  }

  ngOnDestroy(): void {
    this.connectionEffect.destroy();
  }
}
