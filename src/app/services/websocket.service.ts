import { Injectable, signal } from '@angular/core';
import {BoardSession} from '../moldels/cards.models';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private ws!: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private currentSessionSignal = signal<BoardSession | null>(null);
  private currentParticipantSignal = signal<string>('');
  private connectionStatusSignal = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');

  public currentSession = this.currentSessionSignal.asReadonly();
  public currentParticipant = this.currentParticipantSignal.asReadonly();
  public connectionStatus = this.connectionStatusSignal.asReadonly();

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(): string {
    if (this.isProduction()) {
      // ✅ NOVA URL DO RAILWAY
      return 'wss://retro-scrum-production.up.railway.app';
    }
    return 'ws://localhost:3000';
  }

  private isProduction(): boolean {
    return window.location.hostname !== 'localhost';
  }

  private connect(): void {
    this.connectionStatusSignal.set('connecting');

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log(`🔌 Conectando em: ${wsUrl} (${this.isProduction() ? 'produção' : 'desenvolvimento'})`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Conectado ao servidor WebSocket');
        this.connectionStatusSignal.set('connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        this.connectionStatusSignal.set('disconnected');
      };

      this.ws.onclose = (event) => {
        console.log('🔌 Conexão WebSocket fechada');
        this.connectionStatusSignal.set('disconnected');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // ... resto do código permanece igual
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 10000);

      console.log(`🔄 Tentativa ${this.reconnectAttempts} de reconexão em ${delay}ms`);

      setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'session-created':
        this.currentSessionSignal.set(message.session);
        break;
      case 'session-joined':
        this.currentSessionSignal.set(message.session);
        break;
      case 'session-updated':
        this.currentSessionSignal.set(message.session);
        break;
      case 'session-not-found':
        alert('❌ Sessão não encontrada!');
        break;
    }
  }

  // Métodos públicos permanecem iguais
  createSession(sessionName: string, userName: string): void {
    this.currentParticipantSignal.set(userName);
    this.send({ type: 'create-session', sessionName, userName });
  }

  joinSession(sessionId: string, userName: string): void {
    this.currentParticipantSignal.set(userName);
    this.send({ type: 'join-session', sessionId, userName });
  }

  addCard(content: string, column: string): void {
    const session = this.currentSessionSignal();
    if (session) {
      this.send({ type: 'add-card', sessionId: session.id, content, column });
    }
  }

  markFinished(): void {
    const session = this.currentSessionSignal();
    const userName = this.currentParticipantSignal();
    if (session && userName) {
      this.send({ type: 'mark-finished', sessionId: session.id, userName });
    }
  }

  revealCards(): void {
    const session = this.currentSessionSignal();
    if (session) {
      this.send({ type: 'reveal-cards', sessionId: session.id });
    }
  }

  voteCard(cardId: string): void {
    const session = this.currentSessionSignal();
    if (session) {
      this.send({ type: 'vote-card', sessionId: session.id, cardId });
    }
  }

  deleteCard(cardId: string): void {
    const session = this.currentSessionSignal();
    if (session) {
      this.send({ type: 'delete-card', sessionId: session.id, cardId });
    }
  }

  leaveSession(): void {
    this.currentSessionSignal.set(null);
    this.currentParticipantSignal.set('');
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket não conectado');
    }
  }
}
