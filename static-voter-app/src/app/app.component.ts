import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
    currentView: 'search' | 'dashboard' = 'search';

  showSearch(): void {
    this.currentView = 'search';
  }

  showDashboard(): void {
    this.currentView = 'dashboard';
  }
}
