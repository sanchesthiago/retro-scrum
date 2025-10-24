import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { BoardService } from '../../services/board.service';
import {BoardComponent} from '../board/board.component';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  imports: [
    BoardComponent
  ],
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnDestroy {
  private boardService = inject(BoardService);

  session = this.boardService.currentSession;
  currentParticipant = this.boardService.currentParticipant;
  connectionStatus = this.boardService.connectionStatus;

  isCreating = signal(false);
  isJoining = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  sessionName = signal('');
  userName = signal('');
  sessionId = signal('');

  private connectionEffect = effect(() => {
    const status = this.connectionStatus();
    if (status === 'disconnected') {
      this.errorMessage.set('❌ Conexão perdida. Tentando reconectar...');
    } else if (status === 'connected' && this.errorMessage().includes('conexão')) {
      this.errorMessage.set('');
    }
  });

  createSession(): void {
    const name = this.userName().trim();
    const sessionName = this.sessionName().trim();

    if (name && sessionName) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      if (this.connectionStatus() !== 'connected') {
        this.errorMessage.set('⏳ Aguardando conexão com o servidor...');
        this.isLoading.set(false);
        return;
      }

      this.boardService.createSession(sessionName, name);
      this.isLoading.set(false);
    }
  }

  joinSession(): void {
    const name = this.userName().trim();
    const sessionId = this.sessionId().trim();

    if (name && sessionId) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      if (this.connectionStatus() !== 'connected') {
        this.errorMessage.set('⏳ Aguardando conexão com o servidor...');
        this.isLoading.set(false);
        return;
      }

      this.boardService.joinSession(sessionId, name);
      this.isLoading.set(false);
    }
  }

  leaveSession(): void {
    this.boardService.leaveSession();
    this.resetForm();
  }

  copySessionLink(): void {
    const session = this.session();
    if (session) {
      const url = `${window.location.origin}?session=${session.id}`;
      navigator.clipboard.writeText(url);
      alert('✅ Link copiado! Compartilhe com outros participantes.');
    }
  }

  private resetForm(): void {
    this.sessionName.set('');
    this.userName.set('');
    this.sessionId.set('');
    this.isCreating.set(false);
    this.isJoining.set(false);
    this.errorMessage.set('');
  }

  onUserNameInput(event: Event): void {
    this.userName.set((event.target as HTMLInputElement).value);
  }

  onSessionNameInput(event: Event): void {
    this.sessionName.set((event.target as HTMLInputElement).value);
  }

  onSessionIdInput(event: Event): void {
    this.sessionId.set((event.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    this.connectionEffect.destroy();
  }
}
