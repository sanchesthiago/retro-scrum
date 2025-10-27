import {Component, inject, signal, effect, OnDestroy, OnInit} from '@angular/core';
import {BoardService} from '../../services/board.service';
import {ActivatedRoute, Router} from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnDestroy, OnInit {
  private boardService: BoardService = inject(BoardService);
  private router: Router = inject(Router);
  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  public creatForm = new FormGroup({
    nameFormCreate: new FormControl('', [Validators.required]),
    sessionName: new FormControl('', [Validators.required]),
  });
  public joinForm = new FormGroup({
    joinName: new FormControl('', [Validators.required]),
    joinSession: new FormControl('', [Validators.required]),
  })


  public session = this.boardService.currentSession;
  private connectionStatus = this.boardService.connectionStatus;
  private isLoading = signal(false);
  private errorMessage = signal('');
  public isJoinOrCreate$ = signal('');

  ngOnInit() {
    this.haveUrlParams()
  }

  private connectionEffect = effect(() => {
    const status = this.connectionStatus();
    if (status === 'disconnected') {
      this.errorMessage.set('❌ Conexão perdida. Tentando reconectar...');
    } else if (status === 'connected' && this.errorMessage().includes('conexão')) {
      this.errorMessage.set('');
    }
  });

  private haveUrlParams = (): void => {
    const params: string = this.router.url

    if (params.includes('session')) {
      const session: string = this.activatedRoute.snapshot.queryParams['session']
      console.log(session)
      this.joinForm.get('joinSession')?.setValue(session)
      this.joinForm.get('joinSession')?.disable()
      this.isJoinOrCreate$.set('join')

    }
  }


  createSession(): void {
    const name = this.creatForm.controls['nameFormCreate'].value;
    const sessionName = this.creatForm.controls['sessionName'].value;

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
      this.router.navigate(['/board']);
    }
  }

  joinSession(): void {
    const name = this.joinForm.controls['joinName'].value;
    const sessionId = this.joinForm.controls['joinSession'].value;

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
      this.router.navigate(['/board']);
    }
  }


  ngOnDestroy(): void {
    this.connectionEffect.destroy();
    this.errorMessage.set('');
  }
}
