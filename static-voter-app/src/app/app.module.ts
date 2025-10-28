import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// AG Grid imports
import { AgGridModule } from 'ag-grid-angular';
import { ModuleRegistry, AllCommunityModule, provideGlobalGridOptions } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { AppComponent } from './app.component';
import { SearchComponent } from './search/search.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AgGridModule
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }