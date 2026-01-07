import { Component, OnInit } from '@angular/core';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowSelectedEvent,
  ModuleRegistry,
  AllCommunityModule,
  GridOptions,
  CellContextMenuEvent,
  RowNode,
} from 'ag-grid-community';
import { Voter, FavoriteList } from '../models/voter.model';
import { themeQuartz } from 'ag-grid-community';
import { VoterService } from '../services/voter.service';
import PocketBase from 'pocketbase';
import { NgxSpinnerService } from 'ngx-spinner';
import 'ag-grid-enterprise';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { Router } from '@angular/router';

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
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

  selectedFavoriteForRemove: string = '';
  votersToRemove: string[] = [];
  showRemoveModal: boolean = false;

  columnDefs: ColDef[] = [];

  defaultColDef: ColDef = {
    resizable: true,
    filter: true,
    flex: 1,
    minWidth: 200,
    floatingFilter: true,
    sortable: true,
  };
  newFavoriteName: string = '';
  isLoading: boolean = false;
  showCreateFavoriteModal: boolean = false;
  globalFilterText = '';
  private pb = new PocketBase('https://corporatorelectionnew.onrender.com');
  constructor(
    private voterService: VoterService,
    private spinner: NgxSpinnerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.columnDefs = this.getColumnDefs();
    this.loadData();
    this.loadFavorites();
  }

  async loadData(): Promise<void> {
    this.spinner.show();
    let records = [];
    records = await this.pb.collection('corporatorElectionData').getFullList();
    if (records.length > 0) {
      this.rowData = records;
      this.spinner.hide();
    } else {
      this.spinner.hide();
    }

    // this.voterService.loadVotersData().subscribe({
    //   next: (data: any[]) => {
    //     this.rowData = data;
    //     this.isLoading = false;
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading data:', error);
    //     this.isLoading = false;
    //   }
    // });
  }

  // Helper method to select a favorite
  selectFavorite(favoriteId: string): void {
    this.selectedFavorite = favoriteId;
    this.onFavoriteChange();
  }

  // Helper method to get favorite by ID
  getFavoriteById(favoriteId: string): FavoriteList | undefined {
    return this.voterService.getFavoriteById(favoriteId);
  }
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
      this.gridApi.setGridOption(
    'isExternalFilterPresent',
    () => this.isExternalFilterPresent()
  );

  this.gridApi.setGridOption(
    'doesExternalFilterPass',
    (node: any) => this.doesExternalFilterPass(node)
  );
    // Auto-size columns to fit content
    // params.api.sizeColumnsToFit();
  }

  onGlobalFilterChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.globalFilterText = value.toLowerCase();
  this.gridApi.onFilterChanged();
}

isExternalFilterPresent = (): boolean => {
  return !!this.globalFilterText;
}

doesExternalFilterPass = (node: RowNode): boolean => {
  if (!this.globalFilterText) return true;

  const searchText = this.globalFilterText;

  return Object.keys(node.data).some((key) => {
    const value = node.data[key];

    if (value === null || value === undefined) return false;

    // Handle Date
    if (value instanceof Date) {
      return value.toLocaleDateString('en-GB')
        .toLowerCase()
        .includes(searchText);
    }

    // Handle string / number
    return value.toString().toLowerCase().includes(searchText);
  });
};


  resetAllFilters() {
    this.gridApi.setFilterModel(null);
    this.gridApi.onFilterChanged();
  }

  getColumnDefs(): ColDef[] {
    const isFavoriteSelected =
      this.selectedFavorite && this.selectedFavorite !== 'all';

    return [
      {
        headerName: '',
        field: 'selected',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 80,
        filter: false,
        sortable: false,
      },
      {
        headerName: 'यादी क्र.',
        headerTooltip: 'यादी भाग क्र.',
        field: 'yadibhag',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 180,
      },
      {
        headerName: 'वॉर्ड क्र.',
        headerTooltip: 'वॉर्ड / कॉलेज /विभाग क्रमांक',
        field: 'constno',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 180,
      },
      {
        headerName: 'अ. क्र.',
        headerTooltip: 'अ. क्र.',
        field: 'vno',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 180,
      },
      {
        headerName: 'वि. क्र.',
        headerTooltip: 'विधानसभा निर्वाचन क्षेत्र संख्या',
        field: 'booth',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
        valueGetter: (params: any) => {
          return params.data.booth.split('/')[0];
        },
      },
      {
        headerName: 'अ. क्र. भागात',
        headerTooltip: 'अनुक्रमांक भागात',
        field: 'booth',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
        valueGetter: (params: any) => {
          return params.data.booth.split('/')[2];
        },
      },
      {
        headerName: 'भाग क्र.',
        headerTooltip: 'भाग क्रमांक',
        field: 'booth',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 180,
        valueGetter: (params: any) => {
          return params.data.booth.split('/')[1];
        },
      },
      {
        headerName: 'पूर्ण नाव',
        headerTooltip: 'पूर्ण नाव',
        field: 'name',
        filter: 'agTextColumnFilter',
        tooltipField: 'name',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'पूर्ण नाव (ENG)',
        headerTooltip: 'पूर्ण नाव (ENG)',
        field: 'fullname',
        filter: 'agTextColumnFilter',
        sortable: true,
        tooltipField: 'fullname',
        width: 250,
        valueGetter: (params: any) => {
          return params.data.fullname;
        },
      },
      {
        headerName: 'पहिले नाव (MARATHI)',
        headerTooltip: 'पहिले नाव (MARATHI)',
        field: 'hname',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'पहिले नाव (ENG)',
        headerTooltip: 'पहिले नाव (ENG)',
        field: 'name_english',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'आडनाव (MARATHI)',
        headerTooltip: 'आडनाव (MARATHI)',
        field: 'surname',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'आडनाव (ENG)',
        headerTooltip: 'आडनाव (ENG)',
        field: 'esurname',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'मतदान कार्ड',
        headerTooltip: 'मतदान कार्ड',
        field: 'cardno',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 250,
      },
      {
        headerName: 'मोबाइल',
        headerTooltip: 'मोबाइल',
        field: 'pd_receiving_date_no_1',
        filter: 'agTextColumnFilter',
        tooltipField: 'pd_receiving_date_no_1',
        sortable: true,
        width: 150,
      },
            {
        headerName: 'PD Address',
        headerTooltip: 'PD Address',
        field: 'pd_receiving_date_address',
        filter: 'agTextColumnFilter',
        sortable: true,
        hide: true,
        tooltipField: 'pd_receiving_date_address',
        width: 150,
      },
      // {
      //   headerName: 'मतदान केंद्र',
      //   headerTooltip: 'मतदान केंद्र',
      //   field: 'address',
      //   filter: 'agTextColumnFilter',
      //   sortable: true,
      //   width: 300,
      // },
      {
        headerName: 'वय',
        headerTooltip: 'वय',
        field: 'age',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 100,
      },
      {
        headerName: 'लिंग',
        headerTooltip: 'लिंग',
        field: 'sex',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 100,
      },
      {
        headerName: 'खोली/फ्लॅट क्रमांक',
        headerTooltip: 'खोली/फ्लॅट क्रमांक',
        field: 'RoomFlat_No',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
      },
      {
        headerName: 'विंग',
        headerTooltip: 'विंग',
        field: 'Wing',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
      },
      {
        headerName: 'अपार्टमेंट/इमारत/चाळीचे नाव',
        headerTooltip: 'अपार्टमेंट/इमारत/चाळीचे नाव',
        field: 'Apartment_Building_Chawl_Name',
        filter: 'agTextColumnFilter',
        tooltipField: 'Apartment_Building_Chawl_Name',
        sortable: true,
        width: 200,
      },
      {
        headerName: 'क्षेत्र',
        headerTooltip: 'क्षेत्र',
        field: 'Area',
        filter: 'agTextColumnFilter',
        sortable: true,
        tooltipField: 'Area',
        width: 200,
      },
      {
        headerName: 'लँडमार्क',
        headerTooltip: 'लँडमार्क',
        field: 'Landmark',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
      },
      {
        headerName: 'स्टेशन शहर',
        headerTooltip: 'स्टेशन शहर',
        field: 'Station_City',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
      },
      {
        headerName: 'Family QTY',
        headerTooltip: 'Family QTY',
        field: 'familyqty',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
        hide: true,
      },
      {
        headerName: 'Family Code',
        headerTooltip: 'Family Code',
        field: 'familycode',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 200,
        hide: true,
      },
      {
        headerName: 'मतदान केंद्र',
        headerTooltip: 'मतदान केंद्र',
        field: 'polling_location',
        filter: 'agTextColumnFilter',
        sortable: true,
        tooltipField: 'polling_location',
        width: 200,
      },
            {
        headerName: 'Record ID',
        headerTooltip: 'Record ID',
        field: 'id',
        filter: 'agTextColumnFilter',
        sortable: true,
        hide: true,
        width: 200,
      },
      {
        headerName: 'updated date',
        headerTooltip: 'updated date',
        field: 'updated',
        filter: 'agDateColumnFilter',
        sortable: true,
        hide: true,
        width: 200,
  // ✅ Convert string → DATE ONLY (no time, no UTC)
  valueGetter: (params) => {
    if (!params.data?.updated) return null;

    const d = new Date(params.data.updated.replace(' ', 'T'));

    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );
  },

  filterParams: {
    browserDatePicker: true,
    clearButton: true
  },

  // UI formatting only
  valueFormatter: (params) => {
    if (!params.value) return '';
    return params.value.toLocaleDateString('en-GB');
  }
      },
{
  headerName: 'Created Date',
  field: 'created',
  filter: 'agDateColumnFilter',
  sortable: true,
  width: 200,
  hide: true,

  // ✅ Convert string → DATE ONLY (no time, no UTC)
  valueGetter: (params) => {
    if (!params.data?.created) return null;

    const d = new Date(params.data.created.replace(' ', 'T'));

    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );
  },

  filterParams: {
    browserDatePicker: true,
    clearButton: true
  },

  // UI formatting only
  valueFormatter: (params) => {
    if (!params.value) return '';
    return params.value.toLocaleDateString('en-GB');
  }
},


      {
        field: 'UpdateRecord',
        headerName: 'Update Record',
        width: 50,
        cellRenderer: this.actionCellRenderer.bind(this),
        cellRendererParams: {
          onClick: this.onEditClick.bind(this),
        },
        pinned: 'right',
        filter: false,
        sortable: false,
      },
      // Add remove action column only when viewing a favorite
      ...(isFavoriteSelected
        ? [
            {
              headerName: 'Actions',
              field: 'actions',
              width: 100,
              filter: false,
              sortable: false,
              cellRenderer: (params: any) => {
                return `
          <button class="btn btn-sm btn-outline-danger" 
                  onclick="this.removeVoter('${params.data.id}')"
                  title="Remove from favorite">
            <i class="fas fa-times"></i>
          </button>
        `;
              },
            },
          ]
        : []),
    ];
  }

  // action-cell-renderer.component.ts (or inline function)
  // actionCellRenderer(params: any) {
  //   const button = document.createElement('button');
  //   button.innerText = 'Edit';
  //   button.classList.add('btn', 'btn-sm', 'btn-primary');

  //   // attach click handler
  //   button.addEventListener('click', () => {
  //     if (params.onClick) {
  //       params.onClick(params.data); // pass row data
  //     }
  //   });

  //   return button;
  // }

  actionCellRenderer(params: any) {
    const div = document.createElement('div');
    div.className = 'action-buttons';

    // Simple direct link
    const link = document.createElement('a');
    link.href = `/#/edit/${params.data.id}`;
    link.target = '_blank';
    link.className = 'btn btn-sm btn-primary';
    link.innerHTML = '<i class="fas fa-edit"></i> Edit';

    div.appendChild(link);
    return div;
  }

  onEditClick(params: any) {
    //http://localhost:4200/#/edit/2q8jvwnn79em57s
    this.router.navigate(['/edit', params.id]);
  }

  // Add this method to handle remove from grid
  removeVoterFromGrid(voterId: string): void {
    this.removeVoterFromFavorite(voterId);
  }

  onSelectionChanged(): void {
    this.selectedRows = this.gridApi.getSelectedRows();
  }

  loadFavorites(): void {
    this.favorites = this.voterService.getFavorites();
  }

  // Remove voter from favorite
  removeVoterFromFavorite(voterId: string): void {
    if (this.selectedFavorite && this.selectedFavorite !== 'all') {
      this.voterService.removeVoterFromFavorite(this.selectedFavorite, voterId);
      this.loadFavorites();
      this.onFavoriteChange(); // Refresh the grid
    }
  }

  // Remove selected voters from favorite
  removeSelectedVoters(): void {
    if (
      this.selectedFavorite &&
      this.selectedFavorite !== 'all' &&
      this.selectedRows.length > 0
    ) {
      const voterIds = this.selectedRows.map((voter) => voter.id);
      this.voterService.removeVotersFromFavorite(
        this.selectedFavorite,
        voterIds
      );
      this.loadFavorites();
      this.onFavoriteChange(); // Refresh the grid
      this.selectedRows = [];
    }
  }

  // Clear entire favorite list
  clearFavorite(): void {
    if (this.selectedFavorite && this.selectedFavorite !== 'all') {
      if (
        confirm('Are you sure you want to clear all voters from this favorite?')
      ) {
        this.voterService.clearFavorite(this.selectedFavorite);
        this.loadFavorites();
        this.onFavoriteChange(); // Refresh the grid
      }
    }
  }

  // Open remove modal for specific favorite
  openRemoveModal(favoriteId: string): void {
    this.selectedFavoriteForRemove = favoriteId;
    this.showRemoveModal = true;
  }

  // Remove voters from specific favorite
  removeVotersFromSpecificFavorite(voterIds: string[]): void {
    this.voterService.removeVotersFromFavorite(
      this.selectedFavoriteForRemove,
      voterIds
    );
    this.loadFavorites();
    this.showRemoveModal = false;
    this.selectedFavoriteForRemove = '';

    // If we're currently viewing this favorite, refresh the grid
    if (this.selectedFavorite === this.selectedFavoriteForRemove) {
      this.onFavoriteChange();
    }
  }

  // Check if voter is selected for removal
  isVoterSelectedForRemove(voterId: string): boolean {
    return this.votersToRemove.includes(voterId);
  }

  // Toggle voter selection for removal
  toggleVoterForRemove(voterId: string): void {
    const index = this.votersToRemove.indexOf(voterId);
    if (index > -1) {
      this.votersToRemove.splice(index, 1);
    } else {
      this.votersToRemove.push(voterId);
    }
  }

  // Select all voters for removal
  selectAllVotersForRemove(): void {
    if (this.selectedFavorite && this.selectedFavorite !== 'all') {
      const favorite = this.voterService.getFavoriteById(this.selectedFavorite);
      if (favorite) {
        this.votersToRemove = favorite.voters.map((v) => v.id);
      }
    }
  }

  // Deselect all voters for removal
  deselectAllVotersForRemove(): void {
    this.votersToRemove = [];
  }

  onFavoriteChange(): void {
    if (this.selectedFavorite === 'all') {
      this.loadData();
      // this.voterService.loadVotersData().subscribe((data: any) => {
      //   this.rowData = data;
      //   if (this.gridApi) {
      //     this.gridApi.deselectAll();
      //   }
      // });
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
