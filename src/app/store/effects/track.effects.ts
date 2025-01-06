import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { TrackService } from '../../services/track.service';
import * as TrackActions from '../actions/track.actions';

// TODO: add the track effects to the server indexedDb
@Injectable()
export class TrackEffects {
  loadTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.loadTracks),
      mergeMap(() =>
        this.trackService.getAllTracks().pipe(
          map((tracks) => TrackActions.loadTracksSuccess({ tracks })),
          catchError((error) =>
            of(TrackActions.loadTracksFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // TODO: add the addTrack$ to the server indexedDb
  addTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.addTrack),
      mergeMap(({ track }) =>
        this.trackService.addTrack(track).pipe(
          map((newTrack) => TrackActions.addTrackSuccess({ track: newTrack })),
          catchError((error) =>
            of(TrackActions.addTrackFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // TODO: add the deleteTrack$ to the server indexedDb
  deleteTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrackActions.deleteTrack),
      mergeMap(({ id }) =>
        this.trackService.deleteTrack(id).pipe(
          map(() => TrackActions.deleteTrackSuccess({ id })),
          catchError((error) =>
            of(TrackActions.deleteTrackFailure({ error: error.message }))
          )
        )
      )
    )
  );

  constructor(private actions$: Actions, private trackService: TrackService) {}
}
