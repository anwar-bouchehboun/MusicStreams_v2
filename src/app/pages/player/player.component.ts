import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { takeUntil, tap, take, map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MusicCategory, Track } from '../../models/track.interface';
import { AudioService } from '../../services/audio.service';
import { PlaybackStatus } from '../../models/playerstate.interface';
import { AppState } from '../../models/app.state';
import { FormatDurationPipe } from '../../shared/pipes/format-duration.pipe';
import { RouterModule } from '@angular/router';
import { TrackService } from '../../services/track.service';
import { TrackActions, PlayerActions } from '../../store/actions/track.actions';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSliderModule,
    MatButtonModule,
    FormatDurationPipe,
    RouterModule,
  ],
  template: `
    <div class="flex flex-col gap-6 p-6 md:flex-row">
      <!-- Liste des pistes -->
      <div class="w-full md:w-1/2">
        <h2 class="mb-4 text-2xl font-bold">Ma Bibliothèque</h2>
        <div class="grid gap-4">
          @for (track of tracks$ | async; track $index) {
          <div
            class="flex items-center p-4 bg-white rounded-lg shadow-md transition-shadow cursor-pointer hover:shadow-lg"
            [class.bg-blue-50]="(currentTrack$ | async)?.id === track.id"
            (click)="playTrack(track)"
          >
            <img
              [src]="track.coverUrl || 'assets/images/music.png'"
              class="mr-4 w-16 h-16 rounded"
              alt="Cover"
            />
            <div class="flex-grow">
              <h3 class="font-semibold">{{ track.title }}</h3>
              <p class="text-gray-600">{{ track.artist }}</p>
            </div>
            <span class="text-gray-500">{{
              track.duration | formatDuration
            }}</span>
          </div>
          }
        </div>
      </div>

      <!-- Lecteur -->
      <div class="w-full md:w-1/2">
        @if (currentTrack$ | async; as currentTrack) {
        <div class="p-6 bg-gray-100 rounded-lg shadow-lg">
          <img
            [src]="currentTrack.coverUrl || 'assets/images/music.png'"
            class="mx-auto mb-6 w-64 h-64 rounded-lg shadow-md"
            alt="Current track cover"
          />

          <div class="mb-6 text-center">
            <h2 class="text-2xl font-bold">{{ currentTrack.title }}</h2>
            <p class="text-gray-600">{{ currentTrack.artist }}</p>
          </div>

          <!-- Contrôles de lecture -->
          <div class="flex justify-center items-center mb-6 space-x-8">
            <button
              mat-icon-button
              (click)="onPrevious()"
              class="transition-transform transform hover:scale-110"
            >
              <mat-icon>skip_previous</mat-icon>
            </button>

            @if (isPlaying$ | async) {
            <button
              mat-fab
              color="primary"
              (click)="onPause()"
              class="transition-transform transform hover:scale-105"
            >
              <mat-icon>pause</mat-icon>
            </button>
            } @else {
            <button
              mat-fab
              color="primary"
              (click)="onPlay(currentTrack)"
              class="transition-transform transform hover:scale-105"
            >
              <mat-icon>play_arrow</mat-icon>
            </button>
            }

            <button
              mat-icon-button
              (click)="onNext()"
              class="transition-transform transform hover:scale-110"
            >
              <mat-icon>skip_next</mat-icon>
            </button>
          </div>

          <!-- Barre de progression -->
          <div class="mx-auto mb-4 w-full max-w-xl">
            <mat-slider class="w-full" [max]="100" [step]="1">
              <input
                matSliderThumb
                [value]="progress$ | async"
                (valueChange)="onSeek($event)"
              />
            </mat-slider>
            <div class="flex justify-between px-2 text-sm text-gray-600">
              <span>{{ currentTime$ | async | formatDuration }}</span>
              <span>{{ duration$ | async | formatDuration }}</span>
            </div>
          </div>

          <!-- Volume -->
          <div class="flex justify-center items-center mt-4 ml-40 w-24">
            <button
              mat-icon-button
              (click)="toggleMute()"
              class="transition-transform transform hover:scale-110"
            >
              <mat-icon>{{
                (volume$ | async) === 0 ? 'volume_off' : 'volume_up'
              }}</mat-icon>
            </button>
            <mat-slider class="w-32" [max]="1" [step]="0.01">
              <input
                matSliderThumb
                [value]="volume$ | async"
                (valueChange)="onVolumeChange($event)"
              />
            </mat-slider>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .progress-controls {
        position: relative;
      }
      .mat-mdc-slider {
        width: 100%;
      }
      .mdc-slider__input {
        cursor: pointer;
      }
    `,
  ],
})
export class PlayerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tracks$ = this.store.select((state) => state.tracks.tracks);
  currentTrack$ = this.store.select((state) => state.player.currentTrack);
  isPlaying$ = this.store.select(
    (state) => state.player.status === PlaybackStatus.PLAYING
  );
  currentTime$ = this.store.select((state) => state.player.currentTime);
  duration$ = this.store.select((state) => state.player.duration);
  volume$ = this.store.select((state) => state.player.volume);
  isMuted$ = this.store.select((state) => state.player.isMuted);
  progress$ = this.store.select((state) => {
    const currentTime = state.player.currentTime || 0;
    const duration = state.player.duration || 1;
    return (currentTime / duration) * 100;
  });
  playerStatus$ = this.store.select((state) => state.player.status);
  isBuffering$ = this.store.select(
    (state) => state.player.status === PlaybackStatus.BUFFERING
  );

  defaultTrack: Track = {
    id: '',
    title: 'Aucune piste sélectionnée',
    artist: 'Veuillez sélectionner une piste',
    description: '',
    fileUrl: '',
    duration: 0,
    category: 'other' as MusicCategory,
    addedDate: new Date(),
    coverUrl: 'assets/images/music.png',
  };

  constructor(
    private store: Store<AppState>,
    private audioService: AudioService,
    private trackService: TrackService
  ) {}

  ngOnInit() {
    // Initialiser le volume
    this.onVolumeChange(0.7);

    // Charger les pistes
    this.store.dispatch(TrackActions.loadTracks());

    // Restaurer l'état du lecteur au chargement
    this.tryRestoreLastPlayedTrack();


  }

  private async tryRestoreLastPlayedTrack() {
    try {
      const savedState = localStorage.getItem(
        this.audioService.PLAYER_STATE_KEY
      );
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.track) {
          // Dispatch l'action pour mettre à jour le track actuel
          this.store.dispatch(
            PlayerActions.setCurrentTrack({ track: state.track })
          );

          // Restaurer le volume
          if (state.volume !== undefined) {
            this.onVolumeChange(state.volume);
          }

          // Restaurer la position de lecture
          if (state.currentTime) {
            await this.playTrack(state.track);
            this.audioService.seek(state.currentTime);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration du dernier état:', error);
    }
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Nettoyage supplémentaire
    this.audioService.cleanup();
    this.store.dispatch(PlayerActions.setCurrentTrack({ track: null }));
    this.store.dispatch(
      PlayerActions.setStatus({ status: PlaybackStatus.STOPPED })
    );

    // Sauvegarde de l'état actuel
    const currentTrack = await firstValueFrom(this.currentTrack$);
    if (currentTrack) {
      localStorage.removeItem(`track_${currentTrack.id}`);
      localStorage.removeItem(this.audioService.PLAYER_STATE_KEY);
    }
  }

  async playTrack(track: Track) {
    if (!track) return;

    try {
      const trackData = await firstValueFrom(
        this.trackService.getTrackById(track.id)
      );

      if (!trackData?.fileUrl) {
        throw new Error('URL du fichier audio manquante');
      }

      this.store.dispatch(PlayerActions.setCurrentTrack({ track }));

      // Restaurer la dernière position de lecture
      const savedPosition = await this.audioService.restorePlaybackPosition(
        track.id
      );

      await this.audioService.play(trackData);

      // Si une position sauvegardée existe, l'appliquer après un court délai
      if (savedPosition !== null) {
        // Attendre un court instant pour que l'audio soit chargé
        setTimeout(() => {
          this.audioService.seek(savedPosition / trackData.duration);
        }, 100);
      }
    } catch (error) {
      console.error('Erreur de lecture:', error);
      this.store.dispatch(
        PlayerActions.setStatus({
          status: PlaybackStatus.ERROR,
          error: 'Erreur lors de la lecture',
        })
      );
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private async tryRestorePlayerState(track: Track) {
    try {
      const savedState = localStorage.getItem(
        this.audioService.PLAYER_STATE_KEY
      );
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.track?.id === track.id) {
          await this.audioService.restorePlayerState();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  }

  async onNext() {
    try {
      const currentTrack = await firstValueFrom(this.currentTrack$);
      if (!currentTrack) return;

      const nextTrack = await firstValueFrom(
        this.trackService.getNextTrack(currentTrack.id)
      );

      if (nextTrack) {
        this.store.dispatch(PlayerActions.next({ track: nextTrack }));
        await this.playTrack(nextTrack);
      } else {
        Swal.fire({
          title: 'Fin de la playlist',
          text: 'Vous êtes à la dernière piste de la playlist',
          icon: 'info',
        });
      }
    } catch (error) {
      console.error('Erreur lors du passage à la piste suivante:', error);
    }
  }

  async onPrevious() {
    try {
      const currentTrack = await firstValueFrom(this.currentTrack$);
      if (!currentTrack) return;

      const previousTrack = await firstValueFrom(
        this.trackService.getPreviousTrack(currentTrack.id)
      );

      if (previousTrack) {
        this.store.dispatch(PlayerActions.previous({ track: previousTrack }));
        await this.playTrack(previousTrack);
      } else if (this.audioService.getCurrentTime() > 3) {
        // Si on est à plus de 3 secondes, on revient au début
        this.audioService.seek(0);
      }
    } catch (error) {
      console.error('Erreur lors du passage à la piste précédente:', error);
    }
  }

  getStatusMessage(status: PlaybackStatus): string {
    switch (status) {
      case PlaybackStatus.BUFFERING:
        return 'Chargement en cours...';
      case PlaybackStatus.ERROR:
        return 'Erreur lors de la lecture';
      case PlaybackStatus.LOADING:
        return 'Chargement du fichier...';
      default:
        return '';
    }
  }

  onPlay(track: Track) {
    console.log('onPlay', track);
    if (track.id === this.audioService.getCurrentTrackId()) {
      // Si c'est la même piste, reprendre la lecture
      this.audioService.resume();
    } else {
      // Si c'est une nouvelle piste, la charger et la jouer
      this.playTrack(track);
    }
    this.store.dispatch(
      PlayerActions.setStatus({ status: PlaybackStatus.PLAYING })
    );
  }

  onPause() {
    console.log('onPause');
    this.audioService.pause();
    this.store.dispatch(
      PlayerActions.setStatus({ status: PlaybackStatus.PAUSED })
    );
  }

  onSeek(value: number | null) {
    console.log('onSeek', value);
    if (value !== null) {
      this.volume$.pipe(take(1)).subscribe((volume) => {
        if (volume > 0) {
          this.audioService.seek(value / 100);
        }
      });
    }
  }

  onVolumeChange(value: number | null) {
    if (value !== null && value > 0 && !this.audioService.isMuted()) {
      this.audioService.setVolume(value);
    }
  }

  toggleMute() {
    this.volume$.pipe(take(1)).subscribe((volume) => {
      this.audioService.toggleMute(volume || 0);
    });
  }

  onError() {
    console.error('Erreur lors de la lecture de la piste');
    this.store.dispatch(
      PlayerActions.setStatus({
        status: PlaybackStatus.ERROR,
        error: 'Erreur lors de la lecture',
      })
    );
  }
}
