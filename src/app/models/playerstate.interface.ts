import { Track } from './track.interface';

export interface PlayerState {
  currentTrack: Track | null;
  status: PlaybackStatus;
  volume: number;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  error: string | null;
  queue: Track[];
  currentIndex: number;
  playlist: Track[];
  isMuted: boolean;
}

export enum PlaybackStatus {
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  STOPPED = 'stopped',
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success',
}
