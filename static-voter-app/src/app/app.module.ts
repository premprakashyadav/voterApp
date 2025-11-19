import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// AG Grid imports
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule, provideGlobalGridOptions } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { AppComponent } from './app.component';
import { SearchComponent } from './search/search.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AccordionComponent, AccordionPanelComponent } from 'ngx-bootstrap/accordion';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    DashboardComponent,
    LoginComponent
  ],
  imports: [
    BrowserAnimationsModule,
    AccordionComponent,
    AccordionPanelComponent,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AgGridModule,
    AppRoutingModule
  ],
  providers: [
    AuthService,
    AuthGuard ],
  bootstrap: [AppComponent]
})
export class AppModule { }