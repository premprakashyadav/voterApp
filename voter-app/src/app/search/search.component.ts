import { Component, OnInit } from '@angular/core';
import { VoterService } from '../services/voter.service';
import { Voter } from '../models/voter.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchFields = [
    { value: 'assembly_no', label: 'Assembly No' },
    { value: 'part_no', label: 'Part No' },
    { value: 'boothid', label: 'Booth ID' },
    { value: 'e_last_name', label: 'Last Name' },
    { value: 'e_first_name', label: 'First Name' },
    { value: 'e_middle_name', label: 'Middle Name' },
    { value: 'vcardid', label: 'Voter Card ID' },
    { value: 'e_assemblyname', label: 'Assembly Name' }
  ];

  selectedField: string = '';
  searchValue: string = '';
  searchResults: Voter[] = [];
  mobileNumbers: { [key: string]: string } = {};
  isLoading: boolean = false;

  constructor(private voterService: VoterService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.voterService.loadVotersData().subscribe({
      next: (data) => {
        this.isLoading = false;
        console.log('Loaded voters data:', data.length);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  onSearch(): void {
    debugger;
    if (this.selectedField && this.searchValue) {
      this.searchResults = this.voterService.searchVoters(this.selectedField, this.searchValue);
    } else {
      this.searchResults = [];
    }
  }

  onMobileNumberChange(voterId: string, number: string): void {
    this.mobileNumbers[voterId] = number;
  }

  shareOnWhatsApp(voter: Voter): void {
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;

    // Clean the mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    
    const message = `Voter Information:
Name: ${voter.e_first_name} ${voter.e_middle_name} ${voter.e_last_name}
Assembly: ${voter.e_assemblyname}
Voter ID: ${voter.vcardid}
Booth: ${voter.boothid}
Part No: ${voter.part_no}
Address: ${voter.e_address}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }

  isWhatsAppEnabled(voterId: string): boolean {
    const number = this.mobileNumbers[voterId];
    return !!number && number.trim().length >= 10;
  }

  clearSearch(): void {
    this.selectedField = '';
    this.searchValue = '';
    this.searchResults = [];
  }
}