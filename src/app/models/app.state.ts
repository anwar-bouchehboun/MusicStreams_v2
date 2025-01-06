import { PlayerState } from './playerstate.interface';
import { TrackState } from '../store/reducers/track.reducer';

export interface AppState {
  player: PlayerState;
  tracks: TrackState;
}
