import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PocketbaseService, Voter } from './pocketbase.service';

export interface FavoriteList {
  id: string;
  name: string;
  voters: Voter[];
}

@Injectable({
  providedIn: 'root'
})
export class VotersService {
  private voters: Voter[] = [];
  private favorites: FavoriteList[] = [];
  private readonly FAVORITES_KEY = 'voter_favorites';

  constructor(private pbService: PocketbaseService) {
    this.loadFavoritesFromStorage();
  }

  // Load voters from PocketBase
  loadVotersData(): Observable<Voter[]> {
    return from(this.pbService.getVoters()).pipe(
      map(data => {
        this.voters = data;
        console.log('✅ Loaded voters from PocketBase:', data.length);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error loading from PocketBase:', error);
        console.log('🔄 Using empty data...');
        this.voters = [];
        return of(this.voters);
      })
    );
  }

  // Load voters with filter
  loadVotersWithFilter(filter: string): Observable<Voter[]> {
    return from(this.pbService.getVoters(filter)).pipe(
      map(data => {
        this.voters = data;
        console.log('✅ Loaded filtered voters:', data.length);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error loading filtered data:', error);
        return of([]);
      })
    );
  }

  // Search voters
  searchVoters(field: string, value: string): Observable<Voter[]> {
    if (!value.trim()) {
      return this.loadVotersData();
    }
    
    return from(this.pbService.searchVoters(field, value)).pipe(
      catchError(error => {
        console.error('Search error:', error);
        // Fallback to client-side filtering
        const filtered = this.voters.filter(voter => {
          const fieldValue = (voter as any)[field]?.toString().toLowerCase();
          return fieldValue?.includes(value.toLowerCase());
        });
        return of(filtered);
      })
    );
  }

  // Export data
  exportFilteredData(filter: string = ''): Observable<Voter[]> {
    return from(this.pbService.exportFilteredData(filter));
  }

  // Get all voters (client-side)
  getAllVoters(): Voter[] {
    return this.voters;
  }

  // Favorites management (local storage)
  private loadFavoritesFromStorage(): void {
    const stored = localStorage.getItem(this.FAVORITES_KEY);
    if (stored) {
      this.favorites = JSON.parse(stored);
    }
  }

  private saveFavoritesToStorage(): void {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favorites));
  }

  getFavorites(): FavoriteList[] {
    return this.favorites;
  }

  createFavorite(name: string, voters: Voter[]): void {
    const newFavorite: FavoriteList = {
      id: Date.now().toString(),
      name,
      voters: [...voters]
    };
    this.favorites.push(newFavorite);
    this.saveFavoritesToStorage();
  }

  updateFavorite(id: string, name: string): void {
    const favorite = this.favorites.find(f => f.id === id);
    if (favorite) {
      favorite.name = name;
      this.saveFavoritesToStorage();
    }
  }

  deleteFavorite(id: string): void {
    this.favorites = this.favorites.filter(f => f.id !== id);
    this.saveFavoritesToStorage();
  }

  getFavoriteVoters(favoriteId: string): Voter[] {
    if (favoriteId === 'all') return this.voters;
    const favorite = this.favorites.find(f => f.id === favoriteId);
    return favorite ? favorite.voters : [];
  }
}