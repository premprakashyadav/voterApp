import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import PocketBase from 'pocketbase';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css']
})
export class EditFormComponent implements OnInit {
  editForm: FormGroup;
  recordId: string = '';
  isSaving: boolean = false;
  private pb: PocketBase;
  private readonly COLLECTION_NAME = 'corporatorElectionData';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.pb = new PocketBase('https://corporatorelectionnew.onrender.com'); // Replace with your PocketBase URL
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    this.recordId = this.route.snapshot.paramMap.get('id') || '';
    if (this.recordId) {
      this.loadRecordData();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      fullname: [''],
      hname: [''],
      name_english: [''],
      surname: [''],
      esurname: [''],
      pd_receiving_date_no_1: [null],
      pd_receiving_date_address: [''],
      RoomFlat_No: [''],
      Wing: [''],
      Apartment_Building_Chawl_Name: [''],
      Area: [''],
      Landmark: [''],
      Station_City: ['']
    });
  }

  async loadRecordData() {
    try {
      this.spinner.show('loadSpinner', {
        type: 'ball-scale-multiple',
        size: 'medium',
        bdColor: 'rgba(51,51,51,0.8)',
        color: '#fff',
        fullScreen: false
      });

      const record = await this.pb.collection(this.COLLECTION_NAME).getOne(this.recordId);
      
      // Patch only the required fields
      const formData = {
        name: record['name'] || '',
        fullname: record['fullname'] || '',
        hname: record['hname'] || '',
        name_english: record['name_english'] || '',
        surname: record['surname'] || '',
        esurname: record['esurname'] || '',
        pd_receiving_date_no_1: record['pd_receiving_date_no_1'] || null,
        pd_receiving_date_address: record['pd_receiving_date_address'] || '',
        RoomFlat_No: record['RoomFlat_No'] || '',
        Wing: record['Wing'] || '',
        Apartment_Building_Chawl_Name: record['Apartment_Building_Chawl_Name'] || '',
        Area: record['Area'] || '',
        Landmark: record['Landmark'] || '',
        Station_City: record['Station_City'] || ''
      };
      
      this.editForm.patchValue(formData);
      
    } catch (error: any) {
      console.error('Error loading record:', error);
      this.showMessage(`Error loading record: ${error.message || 'Unknown error'}`, 'error');
      this.router.navigate(['/dashboard']);
    } finally {
      this.spinner.hide('loadSpinner');
    }
  }

  async onSubmit() {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    try {
      this.spinner.show('saveSpinner', {
        type: 'ball-scale-multiple',
        size: 'medium',
        bdColor: 'rgba(51,51,51,0.8)',
        color: '#fff'
      });

      this.isSaving = true;
      const formData = this.editForm.value;
      
      // Clean numeric field
      if (formData.pd_receiving_date_no_1 === '' || formData.pd_receiving_date_no_1 === null) {
        formData.pd_receiving_date_no_1 = null;
      } else if (formData.pd_receiving_date_no_1 !== undefined) {
        formData.pd_receiving_date_no_1 = Number(formData.pd_receiving_date_no_1);
      }

      // Update record in PocketBase
      const updatedRecord = await this.pb.collection(this.COLLECTION_NAME).update(this.recordId, formData);
      
      // Show success message
      this.showMessage('Record updated successfully!', 'success');
      
      // Update grid data and redirect
      setTimeout(() => {
       // this.updateGridAndNavigate(updatedRecord);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating record:', error);
      this.showMessage(`Error: ${error.message || 'Failed to update record'}`, 'error');
    } finally {
      this.spinner.hide('saveSpinner');
      this.isSaving = false;
    }
  }

  private updateGridAndNavigate(updatedRecord: any) {
    // Pass updated data back to grid component
    this.router.navigate(['/dashboard'], {
      state: { 
        updatedRecord: updatedRecord,
        updatedRecordId: this.recordId
      }
    });
  }

  onCancel() {
    if (this.editForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Create and show toast message
    const toast = document.createElement('div');
    toast.className = `toaster-parent toast-message ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
      document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['pattern']) return 'Invalid format';
    
    return 'Invalid value';
  }
}