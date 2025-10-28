import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi, GridReadyEvent, RowSelectedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Voter, FavoriteList } from '../models/voter.model';
import { themeQuartz } from 'ag-grid-community';
import { VotersService } from '../services/voters.service';
import { VoterService } from '../services/voter.service';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private gridApi!: GridApi;
  rowData: any[] = [];
  selectedRows: Voter[] = [];
  
  // Add theme property
  themeClass: any = themeQuartz;
  
  favorites: any[] = [];
  selectedFavorite: string = 'all';
  isEditingFavorite: { [key: string]: boolean } = {};
  editFavoriteName: string = '';

  columnDefs: ColDef[] = [
    { 
      headerName: '', 
      field: 'selected', 
      checkboxSelection: true, 
      headerCheckboxSelection: true,
      width: 60,
      filter: false,
      sortable: false
    },
    { headerName: 'First Name', field: 'e_first_name', filter: true, sortable: true },
    { headerName: 'Middle Name', field: 'e_middle_name', filter: true, sortable: true },
    { headerName: 'Last Name', field: 'e_last_name', filter: true, sortable: true },
    { headerName: 'Assembly No', field: 'assembly_no', filter: true, sortable: true },
    { headerName: 'Part No', field: 'part_no', filter: true, sortable: true },
    { headerName: 'Booth ID', field: 'boothid', filter: true, sortable: true },
    { headerName: 'Voter Card ID', field: 'vcardid', filter: true, sortable: true },
    { headerName: 'Assembly Name', field: 'e_assemblyname', filter: true, sortable: true },
    { headerName: 'Age', field: 'age', filter: true, sortable: true },
    { headerName: 'Sex', field: 'sex', filter: true, sortable: true }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    filter: true,
    sortable: true,
  };

  newFavoriteName: string = '';
  isLoading: boolean = false;
  showCreateFavoriteModal: boolean = false;

  constructor(private voterService: VoterService) {}

  ngOnInit(): void {
    this.voterService.loadVotersData().subscribe(data => {
      this.rowData = data;
    });
    this.loadData();
    this.loadFavorites();
  }

    loadData(): void {
    this.isLoading = true;
    this.voterService.loadVotersData().subscribe({
      next: (data: any[]) => {
        this.rowData = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();
  }

  onSelectionChanged(): void {
    this.selectedRows = this.gridApi.getSelectedRows();
  }

  loadFavorites(): void {
    this.favorites = this.voterService.getFavorites();
  }

  onFavoriteChange(): void {
    if (this.selectedFavorite === 'all') {
      this.voterService.loadVotersData().subscribe((data: any) => {
        this.rowData = data;
        if (this.gridApi) {
          this.gridApi.deselectAll();
        }
      });
    } else {
      this.rowData = this.voterService.getFavoriteVoters(this.selectedFavorite);
      if (this.gridApi) {
        this.gridApi.deselectAll();
      }
    }
    this.selectedRows = [];
  }

  openCreateFavoriteModal(): void {
    if (this.selectedRows.length > 0) {
      this.showCreateFavoriteModal = true;
    }
  }

  createFavorite(): void {
    if (this.newFavoriteName.trim()) {
      this.voterService.createFavorite(this.newFavoriteName, this.selectedRows);
      this.loadFavorites();
      this.newFavoriteName = '';
      this.showCreateFavoriteModal = false;
      if (this.gridApi) {
        this.gridApi.deselectAll();
      }
      this.selectedRows = [];
    }
  }

  startEditFavorite(favorite: FavoriteList): void {
    this.isEditingFavorite[favorite.id] = true;
    this.editFavoriteName = favorite.name;
  }

  saveEditFavorite(favorite: FavoriteList): void {
    if (this.editFavoriteName.trim()) {
      this.voterService.updateFavorite(favorite.id, this.editFavoriteName);
      this.loadFavorites();
      this.isEditingFavorite[favorite.id] = false;
      this.editFavoriteName = '';
    }
  }

  cancelEditFavorite(favoriteId: string): void {
    this.isEditingFavorite[favoriteId] = false;
    this.editFavoriteName = '';
  }

  deleteFavorite(favoriteId: string): void {
    if (confirm('Are you sure you want to delete this favorite?')) {
      this.voterService.deleteFavorite(favoriteId);
      this.loadFavorites();
      if (this.selectedFavorite === favoriteId) {
        this.selectedFavorite = 'all';
        this.onFavoriteChange();
      }
    }
  }

  onFirstDataRendered(): void {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
}