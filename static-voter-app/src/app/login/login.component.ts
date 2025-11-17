import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']

})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // If already logged in, redirect to return url
    if (this.authService.hasDashboardAccess()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const result = this.authService.login(this.username, this.password);

    if (result.success) {
      this.router.navigate([this.returnUrl]);
    } else {
      this.errorMessage = result.message;
    }

    this.isLoading = false;
  }

  onDemoLogin(role: 'admin' | 'manager' | 'viewer'): void {
    this.authService.demoLogin(role);
    this.router.navigate([this.returnUrl]);
  }

  onCancel(): void {
    this.router.navigate(['/search']);
  }
}