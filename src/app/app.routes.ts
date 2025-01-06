import { Routes } from '@angular/router';
import { LibraryComponent } from './pages/library/library.component';
import { TrackDetailComponent } from './pages/track-detail/track-detail.component';
import { TrackFormComponent } from './components/track-form/track-form.component';
import { PlayerComponent } from './pages/player/player.component';

export const routes: Routes = [
  { path: '', redirectTo: '/library', pathMatch: 'full' },
  { path: 'library', component: LibraryComponent },
  { path: 'track/:id', component: TrackDetailComponent },
  { path: 'edit-track/:id', component: TrackFormComponent },
  { path: 'add-track', component: TrackFormComponent },
  { path: 'player', component: PlayerComponent },
  { path: '**', redirectTo: '/library' },
];
