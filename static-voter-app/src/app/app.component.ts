import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MetaService } from './services/meta.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
    currentView: 'search' | 'dashboard' = 'search';
    constructor(private metaService: MetaService) {}

  ngOnInit() {
    this.setDefaultMetaTags();
  }

    setDefaultMetaTags() {
    this.metaService.setMetaTags({
      title: 'Voter Search',
      description: 'Search or find your voter details and share on whatsapp',
      image: 'https://voterapp-tctn.onrender.com/pankaj-deshmukh.jpg',
      url: 'https://voterapp-tctn.onrender.com',
      keywords: 'voter, nalasopara, virar'
    });
  }
  showSearch(): void {
    this.currentView = 'search';
  }

  showDashboard(): void {
    this.currentView = 'dashboard';
  }
}
