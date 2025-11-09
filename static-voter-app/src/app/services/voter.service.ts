import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Voter, FavoriteList, voterList } from '../models/voter.model';

@Injectable({
  providedIn: 'root'
})
export class VoterService {
  private voters: Voter[] = [];
  private favorites: FavoriteList[] = [];
  private readonly FAVORITES_KEY = 'voter_favorites';


  constructor(private http: HttpClient) {
    this.loadFavoritesFromStorage();
  }

  // Load initial data from JSON Server API
  loadVotersData(): Observable<Voter[]> {
    this.voters = voterList;
    return of(voterList);
  }

  // Search voters based on criteria
  searchVoters(field: string, value: string): Voter[] {
    if (!value.trim()) return this.voters;
    
    return this.voters.filter(voter => {
      const fieldValue = (voter as any)[field]?.toString().toLowerCase();
      return fieldValue?.includes(value.toLowerCase());
    });
  }

  // Get all voters (for dashboard)
  getAllVoters(): Voter[] {
    return this.voters;
  }


  // Favorites management (same as before)
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
      voters: [...voters],
      created: new Date()
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

    // Remove voter from favorite
  removeVoterFromFavorite(favoriteId: string, voterId: string): void {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    if (favorite) {
      favorite.voters = favorite.voters.filter(v => v.id !== voterId);
      this.saveFavoritesToStorage();
    }
  }

    // Remove multiple voters from favorite
  removeVotersFromFavorite(favoriteId: string, voterIds: string[]): void {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    if (favorite) {
      favorite.voters = favorite.voters.filter(v => !voterIds.includes(v.id));
      this.saveFavoritesToStorage();
    }
  }

   // Clear all voters from favorite (keep the list)
  clearFavorite(favoriteId: string): void {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    if (favorite) {
      favorite.voters = [];
      this.saveFavoritesToStorage();
    }
  }

   // Check if voter is in favorite
  isVoterInFavorite(favoriteId: string, voterId: string): boolean {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    return favorite ? favorite.voters.some(v => v.id === voterId) : false;
  }

    // Get favorite by ID
  getFavoriteById(favoriteId: string): FavoriteList | undefined {
    return this.favorites.find(f => f.id === favoriteId);
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