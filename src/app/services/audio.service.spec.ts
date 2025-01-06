import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';
import { Store } from '@ngrx/store';
import { TrackService } from './track.service';
import { of } from 'rxjs';
import { Track, MusicCategory } from '../models/track.interface';

describe('AudioService', () => {
  let service: AudioService;
  let mockStore: jasmine.SpyObj<Store>;
  let mockTrackService: jasmine.SpyObj<TrackService>;

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
    mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    mockTrackService = jasmine.createSpyObj('TrackService', ['getTrackById']);

    mockTrackService.getTrackById.and.returnValue(of(mockTrack));

    TestBed.configureTestingModule({
      providers: [
        AudioService,
        { provide: Store, useValue: mockStore },
        { provide: TrackService, useValue: mockTrackService },
      ],
    });
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set volume', () => {
    service.setVolume(0.5);
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should toggle mute', () => {
    const currentVolume = 0.5;
    service.toggleMute(currentVolume);
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should clean up resources', () => {
    service.cleanup();
    expect(service.getCurrentTrackId()).toBeNull();
  });
});
