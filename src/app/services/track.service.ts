import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Track } from '../models/track.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TrackService {
  // TODO: the tracks from the server indexedDb
  private dbName = 'musicDB';
  private storeName = 'tracks';

  constructor() {
    this.initDB();
  }

  // TODO: the tracks from the server indexedDb
  private async initDB(): Promise<void> {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'id' });
      }
    };
  }
  // TODO: add the track to the server indexedDb
  addTrack(track: Track, audioFile?: File): Observable<Track> {
    return from(
      new Promise<Track>((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);

          // Stocker l'image et le fichier audio
          const trackToStore = {
            ...track,
            audioFile,
            coverFile: track.coverFile,
          };

          const addRequest = store.add(trackToStore);
          addRequest.onsuccess = () => resolve(track);
          addRequest.onerror = () => reject("Erreur lors de l'ajout du track");
        };
      })
    );
  }

  // TODO: get all the tracks from the server indexedDb
  getAllTracks(): Observable<Track[]> {
    return from(
      new Promise<Track[]>((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);

          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () =>
            reject('Erreur lors de la récupération des tracks');
        };
      })
    );
  }

  deleteTrack(id: string): Observable<void> {
    return from(
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);

          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () =>
            reject('Erreur lors de la suppression du track');
        };

        request.onerror = () =>
          reject("Erreur lors de l'ouverture de la base de données");
      })
    );
  }

  updateTrack(track: Track): Observable<Track> {
    return from(
      new Promise<Track>((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);

          const putRequest = store.put(track);
          putRequest.onsuccess = () => resolve(track);
          putRequest.onerror = () =>
            reject('Erreur lors de la mise à jour du track');
        };
      })
    );
  }

  // TODO: get the track by id from the server indexedDb
  getTrackById(id: string): Observable<Track> {
    return from(
      new Promise<Track>((resolve) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const track = getRequest.result;
            if (track?.audioFile) {
              // Ensure audioFile is a File/Blob object
              track.audioFile = new Blob([track.audioFile], {
                type: track.audioFile.type,
              });
            }
            if (track?.coverFile) {
              // Ensure coverFile is a File/Blob object
              track.coverFile = new Blob([track.coverFile], {
                type: track.coverFile.type,
              });
            }

            resolve(track);
          };
        };
      })
    );
  }

  // TODO: get the next track from the server indexedDb
  getNextTrack(currentTrackId: string): Observable<Track | null> {
    return this.getAllTracks().pipe(
      map((tracks) => {
        if (!tracks || tracks.length === 0) return null;

        const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
        if (currentIndex === -1 || currentIndex >= tracks.length - 1) {
          return null;
        }

        return tracks[currentIndex + 1];
      })
    );
  }

  getPreviousTrack(currentTrackId: string): Observable<Track | null> {
    return this.getAllTracks().pipe(
      map((tracks) => {
        const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
        return currentIndex > 0 ? tracks[currentIndex - 1] : null;
      })
    );
  }
}
