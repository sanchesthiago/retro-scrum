import { Routes } from '@angular/router';
import {SessionComponent} from './pages/session/session.component';
import {BoardComponent} from './pages/board/board.component';

export const appRoutes: Routes = [
  { path: '', component: SessionComponent },
  { path: 'board', component: BoardComponent },
];
