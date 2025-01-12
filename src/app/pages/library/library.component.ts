import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Track } from '../../models/track.interface';
import { TrackActions, PlayerActions } from '../../store/actions/track.actions';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TrackService } from '../../services/track.service';
import { FormatDurationPipe } from '../../shared/pipes/format-duration.pipe';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { selectAllTracks } from '../../store/selectors/track.selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { delay } from 'rxjs/operators';
import { PlaybackStatus } from '../../models/playerstate.interface';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormatDurationPipe,
    HttpClientModule,
    MatProgressSpinnerModule,
  ],
  providers: [TrackService],
  templateUrl: './library.component.html',
  styles: [
    `
      .track-card {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      mat-card-actions {
        margin-top: auto;
        padding: 8px;
      }
    `,
  ],
})
export class LibraryComponent implements OnInit, OnDestroy {
  tracks$ = this.store.select(selectAllTracks);
  private destroy$ = new Subject<void>();
  searchQuery = '';
  selectedCategory = 'all'; // Valeur par défaut
  isLoading = false;

  constructor(
    private store: Store<any>,
    private trackService: TrackService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTracks();
  }
  loadTracks() {
    this.isLoading = true;


    this.trackService
      .getAllTracks()
      .pipe(delay(1000))
      .subscribe({
        next: (tracks) => {
          this.store.dispatch(TrackActions.loadTracksSuccess({ tracks }));
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur de chargement des pistes:', error);
          this.isLoading = false;
        },
      });
  }

  get filteredTracks() {
    let tracks: Track[] = [];
    this.tracks$.subscribe((t) => (tracks = t));

    return tracks
      .map((track) => ({
        ...track,

        // Assurez-vous que coverUrl existe, sinon utilisez l'image par défaut
        coverUrl: track.coverUrl || 'assets/images/music.png',
      }))
      .filter((track) => {
        const searchLower = this.searchQuery.toLowerCase();
        const matchesSearch =
          track.title.toLowerCase().includes(searchLower) ||
          track.artist.toLowerCase().includes(searchLower);

        const matchesCategory =
          this.selectedCategory === 'all' ||
          track.category === this.selectedCategory;

        return matchesSearch && matchesCategory;
      });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
  }

  playTrack(track: Track) {
    this.store.dispatch(PlayerActions['play']({ track }));
  }

  editTrack(track: Track) {
    this.router.navigate(['/edit-track', track.id]);
  }

  deleteTrack(track: Track): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Vous ne pourrez pas revenir en arrière !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.store.dispatch(TrackActions.deleteTrack({ id: track.id }));
      }
    });
  }
  ngOnDestroy() {
    this.store.dispatch(PlayerActions.setCurrentTrack({ track: null }));
    this.store.dispatch(
      PlayerActions.setStatus({ status: PlaybackStatus.STOPPED })
    );
    // Completing destroy$ to clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    
    console.log('LibraryComponent destroyed');
  }

  onImageError(event: any) {
    // Remplacer par l'image par défaut en cas d'erreur de chargement
    event.target.src = 'assets/images/music.png';
  }
}
