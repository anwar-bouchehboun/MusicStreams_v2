import { createAction, props } from '@ngrx/store';
import { Track } from '../../models/track.interface';
import { PlaybackStatus } from '../../models/playerstate.interface';

// TODO: add the track actions to the server indexedDb
// Track Actions
export const loadTracks = createAction('[Track] Load Tracks');
export const loadTracksSuccess = createAction(
  '[Track] Load Tracks Success',
  props<{ tracks: Track[] }>()
);
export const loadTracksFailure = createAction(
  '[Track] Load Tracks Failure',
  props<{ error: any }>()
);

export const addTrack = createAction(
  '[Track] Add Track',
  props<{ track: Track }>()
);
export const addTrackSuccess = createAction(
  '[Track] Add Track Success',
  props<{ track: Track }>()
);
export const addTrackFailure = createAction(
  '[Track] Add Track Failure',
  props<{ error: any }>()
);

export const updateTrack = createAction(
  '[Track] Update Track',
  props<{ track: Track }>()
);
export const updateTrackSuccess = createAction(
  '[Track] Update Track Success',
  props<{ track: Track }>()
);
export const deleteTrack = createAction(
  '[Track] Delete Track',
  props<{ id: string }>()
);
export const deleteTrackSuccess = createAction(
  '[Track] Delete Track Success',
  props<{ id: string }>()
);
export const deleteTrackFailure = createAction(
  '[Track] Delete Track Failure',
  props<{ error: string }>()
);

// TODO: add the player actions to the server indexedDb
// Player Actions
export const play = createAction('[Player] Play', props<{ track: Track }>());
export const pause = createAction('[Player] Pause');
export const stop = createAction('[Player] Stop');
export const setVolume = createAction(
  '[Player] Set Volume',
  props<{ volume: number }>()
);
export const setCurrentTime = createAction(
  '[Player] Set Current Time',
  props<{ time: number }>()
);
export const setStatus = createAction(
  '[Player] Set Status',
  props<{ status: PlaybackStatus; error?: string }>()
);
export const setDuration = createAction(
  '[Player] Set Duration',
  props<{ duration: number }>()
);
export const setCurrentTrack = createAction(
  '[Player] Set Current Track',
  props<{ track: Track | null }>()
);
export const previous = createAction(
  '[Player] Previous',
  props<{ track: Track }>()
);
export const next = createAction('[Player] Next', props<{ track: Track }>());
export const seek = createAction(
  '[Player] Seek',
  props<{ position: number }>()
);
export const setCurrentIndex = createAction(
  '[Player] Set Current Index',
  props<{ index: number }>()
);

// TODO: add the player actions to the server indexedDb
export const PlayerActions = {
  play,
  pause,
  stop,
  setVolume,
  setCurrentTime,
  setStatus,
  setDuration,
  setCurrentTrack,
  previous,
  next,
  seek,
  setCurrentIndex,
};

// TODO: add the track actions to the server indexedDb
export const TrackActions = {
  loadTracks,
  loadTracksSuccess,
  loadTracksFailure,
  addTrack,
  addTrackSuccess,
  addTrackFailure,
  updateTrack,
  deleteTrack,
  deleteTrackSuccess,
  updateTrackSuccess,
  deleteTrackFailure,
};
