import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrackDetailComponent } from './track-detail.component';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MusicCategory, Track } from '../../models/track.interface';
import { Store } from '@ngrx/store';
import { TrackService } from '../../services/track.service';
import { of } from 'rxjs';
import * as TrackActions from '../../store/actions/track.actions';

describe('TrackDetailComponent', () => {
  let component: TrackDetailComponent;
  let fixture: ComponentFixture<TrackDetailComponent>;
  let store: MockStore;
  let trackService: jasmine.SpyObj<TrackService>;

  const mockTrack: Track = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    category: MusicCategory.POP,
    addedDate: new Date(),
    fileUrl: 'test.mp3',
    coverUrl: 'test.jpg'
  };

  beforeEach(async () => {
    const trackServiceSpy = jasmine.createSpyObj('TrackService', ['addTrack']);

    await TestBed.configureTestingModule({
      imports: [
        TrackDetailComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: TrackService, useValue: trackServiceSpy },
        provideMockStore({
          initialState: {
            tracks: {
              tracks: [],
              selectedTrack: mockTrack,
              error: null,
              loading: false
            }
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrackDetailComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store) as MockStore;
    trackService = TestBed.inject(TrackService) as jasmine.SpyObj<TrackService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('devrait ajouter un nouveau track', fakeAsync(() => {
    const newTrack: Track = { ...mockTrack, id: '2', title: 'Nouveau Track' };
    trackService.addTrack.and.returnValue(of(newTrack));

    trackService.addTrack(newTrack).subscribe(track => {
      expect(track).toBeTruthy();
      expect(track.title).toBe('Nouveau Track');
      expect(trackService.addTrack).toHaveBeenCalledWith(newTrack);
    });

    store.dispatch(TrackActions.addTrack({ track: newTrack }));
    tick();
  }));
});
