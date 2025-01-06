import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LibraryComponent } from './library.component';
import { TrackService } from '../../services/track.service';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { Track, MusicCategory } from '../../models/track.interface';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';

describe('LibraryComponent', () => {
  let component: LibraryComponent;
  let fixture: ComponentFixture<LibraryComponent>;
  let trackService: jasmine.SpyObj<TrackService>;

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

  beforeEach(async () => {
    const trackServiceSpy = jasmine.createSpyObj('TrackService', ['addTrack']);
    trackServiceSpy.addTrack.and.returnValue(of(mockTrack));

    await TestBed.configureTestingModule({
      imports: [
        LibraryComponent,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        FormsModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: TrackService, useValue: trackServiceSpy },
        { provide: MatDialog, useValue: {} },
        provideMockStore({
          initialState: {
            tracks: {
              tracks: [],
              selectedTrack: null,
              error: null,
              loading: false,
            },
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LibraryComponent);
    component = fixture.componentInstance;
    trackService = TestBed.inject(TrackService) as jasmine.SpyObj<TrackService>;
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait créer un nouveau track', () => {
    trackService.addTrack(mockTrack).subscribe((track) => {
      expect(track).toBeTruthy();
      expect(track.title).toBe('Test Track');
    });
  });
});
