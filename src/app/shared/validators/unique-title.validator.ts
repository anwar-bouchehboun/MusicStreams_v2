import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { TrackService } from '../../services/track.service';
import { map } from 'rxjs/operators';

export function uniqueTitleValidator(
  trackService: TrackService
): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const title = control.value;

    return trackService.getAllTracks().pipe(
      map((tracks) => {
        const titleExists = tracks.some(
          (track) => track.title.toLowerCase() === title.toLowerCase()
        );
        return titleExists ? { titleExists: true } : null;
      })
    );
  };
}
