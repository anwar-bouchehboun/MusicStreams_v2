import { createReducer, on } from '@ngrx/store';
import { PlayerActions } from '../actions/track.actions';
import { PlaybackStatus } from '../../models/playerstate.interface';

export interface PlayerState {
  currentTrack: any;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
}

const initialState: PlayerState = {
  currentTrack: null,
  status: PlaybackStatus.STOPPED,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
};

export const playerReducer = createReducer(
  initialState,
  on(PlayerActions.play, (state, { track }) => ({
    ...state,
    currentTrack: track,
    status: PlaybackStatus.PLAYING,
  })),
  on(PlayerActions.pause, (state) => ({
    ...state,
    status: PlaybackStatus.PAUSED,
  })),
  on(PlayerActions.setVolume, (state, { volume }) => ({
    ...state,
    volume,
  })),
  on(PlayerActions.setCurrentTime, (state, { time }) => ({
    ...state,
    currentTime: time,
  })),
  on(PlayerActions.setDuration, (state, { duration }) => ({
    ...state,
    duration,
  })),
  on(PlayerActions.setStatus, (state, { status }) => ({
    ...state,
    status,
  })),
  on(PlayerActions.setCurrentIndex, (state, { index }) => ({
    ...state,
    currentIndex: index,
  })),
  on(PlayerActions.previous, (state, { track }) => ({
    ...state,
    currentTrack: track,
  })),
  on(PlayerActions.next, (state, { track }) => ({
    ...state,
    currentTrack: track,
  }))
);

