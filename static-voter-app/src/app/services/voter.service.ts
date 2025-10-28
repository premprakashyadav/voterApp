import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Voter, FavoriteList } from '../models/voter.model';

@Injectable({
  providedIn: 'root'
})
export class VoterService {
  private voters: Voter[] = [];
  private favorites: FavoriteList[] = [];
  private readonly FAVORITES_KEY = 'voter_favorites';
  
  // API endpoint - using JSON Server
  // private apiUrl = '/api/voters'; // local
  private apiUrl = 'http://localhost:3000/voters';

  constructor(private http: HttpClient) {
    this.loadFavoritesFromStorage();
  }

  // Load initial data from JSON Server API
  loadVotersData(): Observable<Voter[]> {
    return this.http.get<Voter[]>(this.apiUrl).pipe(
      map(data => {
        this.voters = data;
        console.log('Successfully loaded voters data from API:', data.length);
        return data;
      }),
      catchError(error => {
        console.error('Error loading data from API, using fallback data:', error);
        // Fallback to sample data if API fails
        this.voters = this.getSampleData();
        return of(this.voters);
      })
    );
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

  // Sample data as fallback
  private getSampleData(): Voter[] {
    return [
      {
        age: 19,
        assembly_no: 132,
        booth_no: 1,
        boothid: 1,
        collectionId: "pbc_3889799233",
        collectionName: "voterData",
        created: "2025-10-06 08:29:53.641Z",
        draft_srno: 0,
        e_address: "1 Khardi Kaner Koshimbe Rod Post Dahisar",
        e_assemblyname: "Nalasopara",
        e_boothaddress: "Z.P. School(Khardi) - Room No. 1",
        e_first_name: "Dhruv",
        e_last_name: "Kharava",
        e_middle_name: "Dipa",
        e_taluka: "",
        e_village: "Khardi",
        house_no: "रुमनं1",
        id: "13200100100001",
        l_address: "1 खार्डी कणेर कोशिंबे रोड पोस्ट दहीसर",
        l_assemblyname: "नालासोपारा",
        l_boothaddress: "जिल्हा परिषद शाळा(खार्डी) - खोली क्र. १",
        l_first_name: "ध्रुव",
        l_last_name: "खारवा",
        l_middle_name: "दीपा",
        l_taluka: "",
        l_village: "खार्डी",
        part_no: 1,
        sex: "M",
        srno: 1,
        updated: "2025-10-06 08:29:53.641Z",
        vcardid: "WEH8946956",
        voted: "No"
      },
      {
        age: 25,
        assembly_no: 132,
        booth_no: 1,
        boothid: 1,
        collectionId: "pbc_3889799234",
        collectionName: "voterData",
        created: "2025-10-06 08:29:53.641Z",
        draft_srno: 0,
        e_address: "2 Khardi Kaner Koshimbe Rod Post Dahisar",
        e_assemblyname: "Nalasopara",
        e_boothaddress: "Z.P. School(Khardi) - Room No. 1",
        e_first_name: "Rahul",
        e_last_name: "Sharma",
        e_middle_name: "Kumar",
        e_taluka: "",
        e_village: "Khardi",
        house_no: "रुमनं2",
        id: "13200100100002",
        l_address: "2 खार्डी कणेर कोशिंबे रोड पोस्ट दहीसर",
        l_assemblyname: "नालासोपारा",
        l_boothaddress: "जिल्हा परिषद शाळा(खार्डी) - खोली क्र. १",
        l_first_name: "राहुल",
        l_last_name: "शर्मा",
        l_middle_name: "कुमार",
        l_taluka: "",
        l_village: "खार्डी",
        part_no: 1,
        sex: "M",
        srno: 2,
        updated: "2025-10-06 08:29:53.641Z",
        vcardid: "WEH8946957",
        voted: "No"
      }
    ];
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