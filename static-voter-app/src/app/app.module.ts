import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

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
import { NgxSpinnerModule } from 'ngx-spinner';
import { EditFormComponent } from './edit-form/edit-form.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    DashboardComponent,
    LoginComponent,
    EditFormComponent
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
    AppRoutingModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' })
  ],
  providers: [
   // AuthService,
    //AuthGuard 
     { provide: LocationStrategy, useClass: HashLocationStrategy }
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }