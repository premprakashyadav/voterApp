import { Injectable, OnDestroy } from '@angular/core';
import { PocketBaseService } from './pocketbase.service';

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

// PocketBase unsubscribe function type
type UnsubscribeFunc = () => Promise<void>;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private subscriptions: UnsubscribeFunc[] = [];

  constructor(private pocketbaseService: PocketBaseService) {}

  /**
   * Get PocketBase instance
   */
  private get pb() {
    return this.pocketbaseService.getPb();
  }

  /**
   * Get records from a collection
   */
  async getRecords(
    collection: string,
    params: PaginationParams = {}
  ): Promise<any> {
    const {
      page = 1,
      perPage = 50,
      sort = '-created',
      filter = '',
      expand = ''
    } = params;

    return await this.pb.collection(collection).getList(page, perPage, {
      sort,
      filter,
      expand
    });
  }

  /**
   * Get all records (paginated automatically)
   */
  async getAllRecords(
    collection: string,
    params: Omit<PaginationParams, 'page' | 'perPage'> = {}
  ): Promise<any[]> {
    const allRecords: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const result = await this.getRecords(collection, {
        ...params,
        page,
        perPage: 500
      });
      
      allRecords.push(...result.items);
      totalPages = result.totalPages;
      page++;
    } while (page <= totalPages);

    return allRecords;
  }

  /**
   * Get single record by ID
   */
  async getRecord(
    collection: string,
    id: string,
    expand?: string
  ): Promise<any> {
    return await this.pb.collection(collection).getOne(id, { expand });
  }

  /**
   * Create new record
   */
  async createRecord(
    collection: string,
    data: any
  ): Promise<any> {
    return await this.pb.collection(collection).create(data);
  }

  /**
   * Update record
   */
  async updateRecord(
    collection: string,
    id: string,
    data: any
  ): Promise<any> {
    return await this.pb.collection(collection).update(id, data);
  }

  /**
   * Delete record
   */
  async deleteRecord(collection: string, id: string): Promise<boolean> {
    return await this.pb.collection(collection).delete(id);
  }

  /**
   * Get your specific collection data
   */
  async getCorporatorElectionData(): Promise<any[]> {
    try {
      return await this.getAllRecords('corporatorElectionData');
    } catch (error: any) {
      console.error('Error getting election data:', error);
      
      if (error.status === 403) {
        console.log('Trying with admin token...');
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to realtime updates
   * Returns a Promise that resolves to unsubscribe function
   */
  async subscribeToCollection(
    collection: string,
    callback: (data: any) => void
  ): Promise<UnsubscribeFunc> {
    try {
      // Subscribe returns a Promise<UnsubscribeFunc>
      const unsubscribe = await this.pb.collection(collection).subscribe('*', callback);
      
      // Store for cleanup
      this.subscriptions.push(unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    collection: string,
    recordId: string,
    fieldName: string,
    file: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    return await this.pb.collection(collection).update(recordId, formData);
  }

  /**
   * Clean up all subscriptions
   */
  async cleanupSubscriptions(): Promise<void> {
    for (const unsubscribe of this.subscriptions) {
      try {
        await unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
    this.subscriptions = [];
  }

  /**
   * Unsubscribe from a specific subscription
   */
  async unsubscribe(subscription: UnsubscribeFunc): Promise<void> {
    try {
      await subscription();
      // Remove from array
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }
}