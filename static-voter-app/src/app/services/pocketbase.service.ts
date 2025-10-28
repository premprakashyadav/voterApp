import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';

export interface Voter {
  id: string;
  collectionId: string;
  collectionName: string;
  age: number;
  assembly_no: number;
  part_no: number;
  boothid: number;
  e_first_name: string;
  e_last_name: string;
  e_middle_name: string;
  vcardid: string;
  e_assemblyname: string;
  e_address: string;
  sex: string;
  voted: string;
  created: string;
  updated: string;
  // Add other fields as needed
}

@Injectable({
  providedIn: 'root'
})
export class PocketbaseService {
  private pb: PocketBase;
  private readonly collectionName = 'voterData';

  constructor() {
    // Initialize PocketBase - adjust URL for your PocketBase instance
    this.pb = new PocketBase('https://voter-database.onrender.com'); // Local development
    // this.pb = new PocketBase('https://your-app.pockethost.io'); // Production
  }

  // Get all voters with optional filter
  async getVoters(filter: string = ''): Promise<Voter[]> {
    try {
      const records = await this.pb.collection(this.collectionName).getFullList({
        filter: filter,
        sort: 'assembly_no,part_no,boothid',
      });
      return records as any;
    } catch (error) {
      console.error('Error fetching voters:', error);
      throw error;
    }
  }

  // Get voters with pagination
  async getVotersPage(page: number = 1, perPage: number = 50, filter: string = ''): Promise<any> {
    try {
      const result = await this.pb.collection(this.collectionName).getList(page, perPage, {
        filter: filter,
        sort: 'assembly_no,part_no,boothid',
      });
      return result;
    } catch (error) {
      console.error('Error fetching voters page:', error);
      throw error;
    }
  }

  // Search voters by field and value
  async searchVoters(field: string, value: string): Promise<Voter[]> {
    try {
      const filter = `${field} ~ "${value}"`;
      return await this.getVoters(filter);
    } catch (error) {
      console.error('Error searching voters:', error);
      throw error;
    }
  }

  // Get voters by assembly number range
  async getVotersByAssemblyRange(min: number, max: number): Promise<Voter[]> {
    const filter = `assembly_no >= ${min} && assembly_no <= ${max}`;
    return await this.getVoters(filter);
  }

  // Export filtered data as JSON
  async exportFilteredData(filter: string = ''): Promise<Voter[]> {
    try {
      const voters = await this.getVoters(filter);
      this.downloadAsJSON(voters, 'voters_export.json');
      return voters;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Download data as JSON file
  private downloadAsJSON(data: any, filename: string): void {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Authentication methods (if needed)
  async login(email: string, password: string): Promise<any> {
    return await this.pb.collection('users').authWithPassword(email, password);
  }

  async logout(): Promise<void> {
    this.pb.authStore.clear();
  }

  isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  getCurrentUser(): any {
    return this.pb.authStore.model;
  }
}