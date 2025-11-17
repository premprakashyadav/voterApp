import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  currentView: string = '';
  isAuthenticated: boolean = false;
  currentUser: User | null = null;
  navbarOpen: boolean = false;
  dropdownOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser.subscribe(user => {
      this.isAuthenticated = this.authService.hasDashboardAccess();
      this.currentUser = user;
    });

    // Subscribe to router events to update currentView
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateCurrentView(event.url);
        this.closeAllMenus(); // Close menus on navigation
      });

    // Initialize currentView based on current URL
    this.updateCurrentView(this.router.url);
  }

  private updateCurrentView(url: string): void {
    if (url.includes('/dashboard')) {
      this.currentView = 'dashboard';
    } else if (url.includes('/login')) {
      this.currentView = 'login';
    } else {
      this.currentView = 'search';
    }
  }

  // Prevent page reload on link clicks
  preventReload(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Toggle navbar for mobile
  toggleNavbar(): void {
    this.navbarOpen = !this.navbarOpen;
  }

  // Toggle dropdown
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Close all menus
  closeAllMenus(): void {
    this.navbarOpen = false;
    this.dropdownOpen = false;
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout();
    this.router.navigate(['/search']);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.dropdownOpen = false;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    // Close navbar on resize (for mobile)
    if (window.innerWidth > 992) {
      this.navbarOpen = false;
    }
  }
}