import { Component, input, signal, inject } from '@angular/core';
import { BoardService } from '../../services/board.service';
import {Card} from '../../moldels/cards.models';
import {CardComponent} from '../cards/card.component';

@Component({
  selector: 'app-column',
  templateUrl: './column.component.html',
  imports: [
    CardComponent
  ],
  styleUrls: ['./column.component.scss']
})
export class ColumnComponent {
  private boardService = inject(BoardService);

  title = input.required<string>();
  type = input.required<'went-well' | 'to-improve' | 'action-items'>();
  cards = input.required<Card[]>();
  isRevealed = input.required<boolean>();
  canAddCards = input.required<boolean>();
  isConnected = input.required<boolean>();

  newCardContent = signal('');
  isAdding = signal(false);

  addCard(): void {
    const content = this.newCardContent().trim();
    if (content && !this.isAdding() && this.isConnected()) {
      this.isAdding.set(true);

      this.boardService.addCard(content, this.type());

      // Simular delay de rede
      setTimeout(() => {
        this.newCardContent.set('');
        this.isAdding.set(false);
      }, 300);
    }
  }

  getColumnCards(): Card[] {
    return this.cards().filter(card => card.column === this.type());
  }

  onContentInput(event: Event): void {
    this.newCardContent.set((event.target as HTMLTextAreaElement).value);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addCard();
    }
  }
}
