import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly AUTH_KEY = 'voter_app_auth';
  private readonly DASHBOARD_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'manager', password: 'manager123', role: 'manager' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' }
  ];

  constructor(private router: Router) {
    // Initialize from localStorage
    const savedUser = localStorage.getItem(this.AUTH_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  public hasDashboardAccess(): boolean {
    const user = this.currentUserValue;
    return user !== null && ['admin', 'manager', 'viewer'].includes(user.role);
  }

  login(username: string, password: string): { success: boolean; message: string } {
    const user = this.DASHBOARD_USERS.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      const userData: User = {
        id: Date.now().toString(),
        username: user.username,
        role: user.role
      };

      localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));
      this.currentUserSubject.next(userData);
      
      return { success: true, message: 'Login successful' };
    } else {
      return { 
        success: false, 
        message: 'Invalid username or password. Use: admin/admin123, manager/manager123, viewer/viewer123' 
      };
    }
  }

  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/search']);
  }

  // For demo purposes - reset to specific user
  demoLogin(role: 'admin' | 'manager' | 'viewer'): void {
    const demoUsers = {
      admin: { username: 'admin', password: 'admin123' },
      manager: { username: 'manager', password: 'manager123' },
      viewer: { username: 'viewer', password: 'viewer123' }
    };

    this.login(demoUsers[role].username, demoUsers[role].password);
  }
}