import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Track } from '../models/track.interface';
import { PlayerActions } from '../store/actions/track.actions';
import { PlaybackStatus } from '../models/playerstate.interface';
import { AppState } from '../models/app.state';
import { TrackService } from '../services/track.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentTrack: Track | null = null;
  private previousVolume: number = 1;
  private _isMuted: boolean = false;
  public readonly PLAYER_STATE_KEY = 'playerState';
  private isAudioContextInitialized = false;

  constructor(
    private store: Store<AppState>,
    private trackService: TrackService
  ) {
    this.audio = new Audio();
    this.setupAudioListeners();
    this.setupPlaybackSaveListeners();
  }

  private async initializeAudioContext() {
    try {
      // Nettoyer complètement l'ancien contexte
      await this.cleanup();

      // Créer un nouvel élément audio
      this.audio = new Audio();
      this.setupAudioListeners();

      // Initialiser le nouveau contexte
      this.audioContext = new AudioContext();
      // TODO: add the gainNode to the server indexedDb
      this.gainNode = this.audioContext.createGain();
      // TODO: add the sourceNode to the server indexedDb
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

      // Établir les connexions
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isAudioContextInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      throw error;
    }
  }

  private setupAudioListeners(): void {
    this.audio.addEventListener('loadedmetadata', () => {
      this.store.dispatch(
        PlayerActions.setDuration({ duration: this.audio.duration })
      );
    });

    this.audio.addEventListener('timeupdate', () => {
      this.store.dispatch(
        PlayerActions.setCurrentTime({ time: this.audio.currentTime })
      );
    });

    this.audio.addEventListener('playing', () => {
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.PLAYING })
      );
    });

    this.audio.addEventListener('pause', () => {
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.PAUSED })
      );
    });

    this.audio.addEventListener('ended', () => {
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.STOPPED })
      );
    });

    this.audio.addEventListener('error', () => {
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.ERROR })
      );
    });

    // Ajouter des listeners pour le buffering
    this.audio.addEventListener('waiting', () => {
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.BUFFERING })
      );
    });

    this.audio.addEventListener('canplay', () => {
      if (this.audio.paused) {
        this.store.dispatch(
          PlayerActions.setStatus({ status: PlaybackStatus.PAUSED })
        );
      }
    });

    // Ajouter un listener pour sauvegarder l'état périodiquement
    this.audio.addEventListener('timeupdate', () => {
      this.savePlayerState();
    });

    // Sauvegarder la position toutes les secondes pendant la lecture
    this.audio.addEventListener('timeupdate', () => {
      this.savePlaybackPosition();
    });

    // Sauvegarder la position lors de la pause
    this.audio.addEventListener('pause', () => {
      this.savePlaybackPosition();
    });
  }

  async play(track: Track): Promise<void> {
    try {
      if (!this.isAudioContextInitialized) {
        await this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Always get fresh track data with audio file
      const freshTrack = await firstValueFrom(
        this.trackService.getTrackById(track.id)
      );

      if (!freshTrack?.audioFile) {
        throw new Error('No audio file found');
      }

      // Create new blob URL
      const audioUrl = URL.createObjectURL(freshTrack.audioFile);

      if (this.currentTrack?.id !== track.id) {
        this.currentTrack = track;
        this.audio.src = audioUrl;
        this.audio.load();
      }

      // Restaurer la dernière position de lecture sans vérifier le temps écoulé
      const savedState = localStorage.getItem(`playback_${track.id}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Restaurer la position directement
        this.audio.currentTime = state.position;
      }

      await this.audio.play();
      this.store.dispatch(PlayerActions.play({ track }));
      this.savePlayerState();

      // Clean up old blob URL when done
      this.audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Playback error:', error);
      this.store.dispatch(
        PlayerActions.setStatus({
          status: PlaybackStatus.ERROR,
          error: 'Unable to play audio file',
        })
      );
    }
  }

  pause(): void {
    // Sauvegarder le volume actuel avant la pause
    this.previousVolume = this.gainNode?.gain.value || 1;

    this.audio.pause();
    this.store.dispatch(PlayerActions.pause());
  }

  seek(position: number): void {
    const newTime = position * this.audio.duration;
    if (isFinite(newTime)) {
      // Ajouter un petit crossfade lors du seek
      this.gainNode?.gain.setValueAtTime(
        0,
        this.audioContext?.currentTime || 0
      );
      this.audio.currentTime = newTime;
      this.gainNode?.gain.linearRampToValueAtTime(
        1,
        this.audioContext?.currentTime || 0 + 0.1
      );
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      // Appliquer le volume au gainNode
      this.gainNode.gain.value = volume;
    }
    // Mettre à jour le store
    this.store.dispatch(PlayerActions.setVolume({ volume }));
  }

  toggleMute(currentVolume: number): void {
    if (currentVolume === 0) {
      // Rétablir le volume précédent
      this.setVolume(this.previousVolume);
    } else {
      // Sauvegarder le volume actuel et couper le son
      this.previousVolume = currentVolume;
      this.setVolume(0);
    }
  }

  async next(track: Track): Promise<void> {
    const nextIndex = (this.audio.currentTime + 1) % track.duration;
    this.audio.currentTime = nextIndex;
    this.audio.play();
    this.play(track);
  }

  async previous(track: Track): Promise<void> {
    const prevIndex =
      (this.audio.currentTime - 1 + track.duration) % track.duration;
    this.audio.currentTime = prevIndex;
    this.audio.play();
    this.play(track);
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getVolume(): number {
    return this.audio.volume;
  }

  getPreviousVolume(): number {
    return this.previousVolume;
  }

  private savePlayerState(): void {
    if (this.currentTrack) {
      const state = {
        trackId: this.currentTrack.id,
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        volume: this.gainNode?.gain.value,
      };
      localStorage.setItem(this.PLAYER_STATE_KEY, JSON.stringify(state));
    }
  }

  public async restorePlayerState(): Promise<void> {
    const savedState = localStorage.getItem(this.PLAYER_STATE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.track && state.trackId) {
          await this.play(state.track);
          if (state.currentTime) {
            this.seek(state.currentTime / state.duration);
          }
          if (state.volume !== undefined) {
            this.setVolume(state.volume);
          }
        }
      } catch (error) {
        console.error('Error restoring player state:', error);
      }
    }
  }

  // Clean up when changing tracks
  private cleanupCurrentTrack() {
    if (this.audio.src) {
      URL.revokeObjectURL(this.audio.src);
    }
  }

  public cleanup(): void {
    // Sauvegarder la position avant le nettoyage
    this.savePlaybackPosition();

    // Stop playback
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }

    // Clean up audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    // AUDIO CLEANUP
    this.isAudioContextInitialized = false;
    this.currentTrack = null;
  }

  resume() {
    if (this.audio) {
      // Restaurer le volume avant de reprendre la lecture
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(
          this.previousVolume,
          this.audioContext?.currentTime || 0
        );
      }
      // AUDIO PLAY
      this.audio.play();
      this.store.dispatch(
        PlayerActions.setStatus({ status: PlaybackStatus.PLAYING })
      );
    }
  }

  getCurrentTrackId(): string | null {
    return this.currentTrack?.id || null;
  }

  public isMuted(): boolean {
    // votre logique pour vérifier si le lecteur est muet
    return this._isMuted; // Assurez-vous que 'isMuted' est une propriété booléenne
  }

  private savePlaybackPosition(): void {
    if (this.currentTrack) {
      const playbackState = {
        trackId: this.currentTrack.id,
        //playback position is the current time of the audio
        position: this.audio.currentTime,
        timestamp: new Date().getTime(),
        volume: this.gainNode?.gain.value || 1,
        duration: this.audio.duration,
        title: this.currentTrack.title,
        artist: this.currentTrack.artist,
        lastPlayedDate: new Date().toISOString(),
      };
      localStorage.setItem(
        `playback_${this.currentTrack.id}`,
        JSON.stringify(playbackState)
      );
    }
  }

  public async restorePlaybackPosition(
    trackId: string
  ): Promise<number | null> {
    try {
      const savedState = localStorage.getItem(`playback_${trackId}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Restaurer directement la position sans vérifier le temps écoulé
        if (state.position >= 0 && state.position <= state.duration) {
          // Vérifier si la position n'est pas trop proche de la fin
          if (state.position < state.duration - 10) {
            return state.position;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de la position:', error);
    }
    return null;
  }

  // Ajouter des écouteurs d'événements supplémentaires pour sauvegarder la position
  private setupPlaybackSaveListeners(): void {
    // Sauvegarder toutes les 10 secondes pendant la lecture
    setInterval(() => {
      if (!this.audio.paused && !this.audio.ended) {
        this.savePlaybackPosition();
      }
    }, 10000);

    // Sauvegarder lors de la pause
    this.audio.addEventListener('pause', () => {
      this.savePlaybackPosition();
    });

    // Sauvegarder lors de la recherche (seek)
    this.audio.addEventListener('seeked', () => {
      this.savePlaybackPosition();
    });

    // Sauvegarder avant la fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.savePlaybackPosition();
    });

    // Sauvegarder lors de la mise en veille de l'onglet
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.savePlaybackPosition();
      }
    });
  }
}
