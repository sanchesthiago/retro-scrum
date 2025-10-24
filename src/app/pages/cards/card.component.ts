import {Component, input, inject, signal} from '@angular/core';
import { BoardService } from '../../services/board.service';
import {Card} from '../../moldels/cards.models';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  private boardService = inject(BoardService);

  card = input.required<Card>();
  isRevealed = input.required<boolean>();
  canInteract = input.required<boolean>();

  isVoting = signal(false);
  isDeleting = signal(false);

  vote(): void {
    if (this.canInteract() && !this.isVoting()) {
      this.isVoting.set(true);
      this.boardService.voteCard(this.card().id);

      setTimeout(() => this.isVoting.set(false), 500);
    }
  }

  delete(): void {
    if (this.canInteract() && !this.isDeleting()) {
      this.isDeleting.set(true);
      this.boardService.deleteCard(this.card().id);

      setTimeout(() => this.isDeleting.set(false), 500);
    }
  }
}
