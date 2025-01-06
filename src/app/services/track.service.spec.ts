import { TestBed } from '@angular/core/testing';
import { TrackService } from './track.service';
import { Track, MusicCategory } from '../models/track.interface';
import { firstValueFrom } from 'rxjs';

describe('TrackService', () => {
  let service: TrackService;

  const mockTrack: Track = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    category: MusicCategory.POP,
    addedDate: new Date(),
    fileUrl: 'test.mp3',
    coverUrl: 'test.jpg',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackService],
    });
    service = TestBed.inject(TrackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add and retrieve a track', async () => {
    await firstValueFrom(service.addTrack(mockTrack));
    const tracks = await firstValueFrom(service.getAllTracks());
    expect(tracks).toContain(
      jasmine.objectContaining({
        id: mockTrack.id,
        title: mockTrack.title,
      })
    );
  });

  it('should update a track', async () => {
    const updatedTrack = { ...mockTrack, title: 'Updated Track' };
    await firstValueFrom(service.updateTrack(updatedTrack));
    const track = await firstValueFrom(service.getTrackById(mockTrack.id));
    expect(track.title).toBe('Updated Track');
  });

  it('should delete a track', async () => {
    await firstValueFrom(service.deleteTrack(mockTrack.id));
    const tracks = await firstValueFrom(service.getAllTracks());
    expect(tracks).not.toContain(
      jasmine.objectContaining({
        id: mockTrack.id,
      })
    );
  });
});
