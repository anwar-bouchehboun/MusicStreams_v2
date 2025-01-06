import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDuration',
  standalone: true,
})
export class FormatDurationPipe implements PipeTransform {
  transform(value: number | null): string {
    if (value === null) return '0:00';

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
