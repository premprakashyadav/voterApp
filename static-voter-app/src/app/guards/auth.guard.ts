import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.authService.hasDashboardAccess()) {
      return true;
    }

    // Redirect to search page with return URL
    this.router.navigate(['/search'], { 
      queryParams: { 
        returnUrl: route.routeConfig?.path,
        requireAuth: true 
      } 
    });
    return false;
  }
}