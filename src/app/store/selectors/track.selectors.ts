import { createSelector } from '@ngrx/store';

import { TrackState } from '../reducers/track.reducer';
import { AppState } from '../../models/app.state';

export const selectTrackState = (state: AppState) => state.tracks;

export const selectAllTracks = createSelector(
  selectTrackState,
  (state: TrackState) => {
    console.log('TrackState:', state);
    return state?.tracks ?? [];
  }
);

export const selectTrackById = (id: string) =>
  createSelector(selectAllTracks, (tracks) => {
    console.log('Searching for track with id:', id);
    console.log('Available tracks:', tracks);
    return tracks.find((t) => t.id === id);
  });

export const selectVolume = (state: AppState) => state?.player?.volume ?? 1;
