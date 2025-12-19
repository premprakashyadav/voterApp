import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PocketBaseService {
  private pb: PocketBase;
  private authSubject = new BehaviorSubject<User | null>(null);
  public auth$ = this.authSubject.asObservable();

  constructor() {
    // Initialize PocketBase with your Render URL
    this.pb = new PocketBase('https://corporatorelection.onrender.com');
    
    // Load saved auth state
    this.loadAuthState();
  }

  /**
   * Initialize service with custom URL
   */
  initialize(url: string) {
    this.pb = new PocketBase(url);
    this.loadAuthState();
  }

  /**
   * Load saved authentication state
   */
  private loadAuthState() {
    if (this.pb.authStore.isValid) {
      this.authSubject.next(this.pb.authStore.model as any);
    }
  }

  /**
   * Get PocketBase instance
   */
  getPb(): PocketBase {
    return this.pb;
  }

  /**
   * Get current user
   */
  get currentUser(): User | null {
    return this.pb.authStore.model as any;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  /**
   * Get authentication token
   */
  get token(): string {
    return this.pb.authStore.token;
  }
}