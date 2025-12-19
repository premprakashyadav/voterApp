import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { PocketBaseService } from './pocketbase.service';

export interface FamilySearchParams {
  query: string;
  fields?: string[];
  includeFamilyMembers?: boolean; // If true, returns all family members when any member matches
  minFamilyQty?: number; // Minimum familyqty to include
}

export interface FamilyGroup {
  familycode: string;
  familyqty: number;
  members: any[];
  searchMatches: any[]; // Members that matched the search
}

@Injectable({
  providedIn: 'root'
})
export class FamilySearchService {
  private pb: PocketBase;

  private searchableFields = [
    'constno', 'yadibhag', 'vno', 'age', 'hno', 'name', 'hname',
    'name_english', 'surname', 'esurname', 'sex', 'cardno', 'relative',
    'relative_english', 'relation', 'address', 'entrytype', 'familycode',
    'familyqty', 'section_no', 'caste', 'deadalive', 'Dubar', 'mobileOld',
    'email', 'shifted', 'blood', 'societyno', 'partyno', 'keypersonno',
    'redgreen', 'leaderno', 'coleaderno', 'oppleaderno', 'voting', 'booth',
    'dubarcode', 'adhar', 'ration', 'senior', 'lat', 'lon', 'gaddress',
    'addressN', 'Mobile'
  ];

  constructor(private pocketbaseService: PocketBaseService) {
    this.pb = this.pocketbaseService.getPb();
  }

  /**
   * Search with family grouping
   */
  async searchWithFamilies(params: FamilySearchParams): Promise<{
    individualResults: any[];
    familyGroups: FamilyGroup[];
    totalMatches: number;
  }> {
    const {
      query,
      fields = this.searchableFields,
      includeFamilyMembers = true,
      minFamilyQty = 1
    } = params;

    if (!query || query.trim() === '') {
      return {
        individualResults: [],
        familyGroups: [],
        totalMatches: 0
      };
    }

    const searchQuery = query.trim();
    
    // Step 1: Get all matching records
    const individualMatches = await this.getIndividualMatches(searchQuery, fields);
    
    if (!includeFamilyMembers) {
      return {
        individualResults: individualMatches,
        familyGroups: [],
        totalMatches: individualMatches.length
      };
    }

    // Step 2: Group by familycode and filter by familyqty
    const familyGroups = await this.groupByFamily(
      individualMatches, 
      minFamilyQty,
      searchQuery,
      fields
    );

    return {
      individualResults: individualMatches,
      familyGroups,
      totalMatches: individualMatches.length
    };
  }

  /**
   * Get individual matches
   */
  private async getIndividualMatches(query: string, fields: string[]): Promise<any[]> {
    // Build search filter
    const filters = fields.map(field => `${field} ~ "${query}"`);
    const filter = filters.join(' || ');

    try {
      // Get all matches (no pagination limit for family grouping)
      const result = await this.pb.collection('corporatorElectionData').getFullList({
        filter,
        sort: 'familycode, name'
      });
      
      return result;
    } catch (error: any) {
      console.error('Error getting individual matches:', error);
      
      // Fallback: Get all records and filter locally
      if (error.status === 400 || error.message.includes('filter')) {
        return this.getIndividualMatchesFallback(query, fields);
      }
      
      throw error;
    }
  }

  /**
   * Fallback for individual matches
   */
  private async getIndividualMatchesFallback(query: string, fields: string[]): Promise<any[]> {
    const allRecords = await this.pb.collection('corporatorElectionData').getFullList({
      sort: 'familycode, name'
    });

    const searchQuery = query.toLowerCase();
    
    return allRecords.filter(record => 
      fields.some(field => {
        const value = record[field];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchQuery);
      })
    );
  }

  /**
   * Group matches by family and get all family members
   */
  private async groupByFamily(
    individualMatches: any[],
    minFamilyQty: number,
    searchQuery: string,
    searchFields: string[]
  ): Promise<FamilyGroup[]> {
    if (individualMatches.length === 0) {
      return [];
    }

    // Extract unique family codes from matches
    const matchedFamilyCodes = Array.from(
      new Set(
        individualMatches
          .filter(record => record.familycode && record.familyqty > minFamilyQty)
          .map(record => record.familycode)
      )
    );

    if (matchedFamilyCodes.length === 0) {
      return [];
    }

    // Get ALL members of these families
    const familyFilter = matchedFamilyCodes
      .map(code => `familycode = "${code}"`)
      .join(' || ');

    try {
      const familyMembers = await this.pb.collection('corporatorElectionData').getFullList({
        filter: familyFilter,
        sort: 'familycode, name'
      });

      // Group by familycode
      const groupedByFamily = this.groupRecordsByFamily(familyMembers);

      // Filter groups by minFamilyQty and identify search matches
      return groupedByFamily
        .filter(group => group.familyqty > minFamilyQty)
        .map(group => ({
          ...group,
          searchMatches: this.findSearchMatchesInGroup(group.members, searchQuery, searchFields)
        }))
        .filter(group => group.searchMatches.length > 0); // Only include groups with matches
      
    } catch (error) {
      console.error('Error grouping by family:', error);
      return [];
    }
  }

  /**
   * Group records by familycode
   */
  private groupRecordsByFamily(records: any[]): FamilyGroup[] {
    const familyMap = new Map<string, any[]>();
    
    // Group by familycode
    records.forEach(record => {
      const familycode = record.familycode || 'NO_FAMILY';
      if (!familyMap.has(familycode)) {
        familyMap.set(familycode, []);
      }
      familyMap.get(familycode)!.push(record);
    });

    // Convert to FamilyGroup array
    return Array.from(familyMap.entries()).map(([familycode, members]) => {
      // Get familyqty from first member (should be same for all)
      const familyqty = members[0]?.familyqty || 1;
      
      return {
        familycode,
        familyqty,
        members: members.sort((a, b) => a.name?.localeCompare(b.name)),
        searchMatches: []
      };
    });
  }

  /**
   * Find which members match the search query
   */
  private findSearchMatchesInGroup(
    members: any[],
    searchQuery: string,
    searchFields: string[]
  ): any[] {
    const query = searchQuery.toLowerCase();
    
    return members.filter(member =>
      searchFields.some(field => {
        const value = member[field];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(query);
      })
    );
  }

  /**
   * Get families with multiple members (familyqty > 1)
   */
  async getMultiMemberFamilies(minQty: number = 1): Promise<FamilyGroup[]> {
    try {
      // First get records with familyqty > minQty
      const filter = `familyqty > ${minQty} && familycode != ""`;
      
      const records = await this.pb.collection('corporatorElectionData').getList(1, 1000, {
        filter,
        sort: 'familycode, name'
      });

      // Group by familycode
      const familyGroups = this.groupRecordsByFamily(records.items);
      
      return familyGroups.filter(group => group.members.length > 1);
    } catch (error) {
      console.error('Error getting multi-member families:', error);
      return [];
    }
  }

  /**
   * Search within a specific family
   */
  async searchInFamily(
    familycode: string,
    query: string,
    fields: string[] = this.searchableFields
  ): Promise<{
    family: FamilyGroup;
    matches: any[];
  }> {
    // Get all family members
    const familyMembers = await this.pb.collection('corporatorElectionData').getFullList({
      filter: `familycode = "${familycode}"`,
      sort: 'name'
    });

    if (familyMembers.length === 0) {
      throw new Error(`Family with code ${familycode} not found`);
    }

    // Group into family structure
    const familyGroup = this.groupRecordsByFamily(familyMembers)[0];
    
    // Find matches within family
    const searchMatches = this.findSearchMatchesInGroup(
      familyGroup.members,
      query,
      fields
    );

    return {
      family: familyGroup,
      matches: searchMatches
    };
  }

  /**
   * Get family tree for a specific person
   */
  async getFamilyTree(personId: string): Promise<FamilyGroup | null> {
    try {
      // Get the person's record
      const person = await this.pb.collection('corporatorElectionData').getOne(personId);
      
      if (!person['familycode']) {
        return null;
      }

      // Get all family members
      const familyMembers = await this.pb.collection('corporatorElectionData').getFullList({
        filter: `familycode = "${person['familycode']}"`,
        sort: 'age desc' // Sort by age for hierarchy
      });

      return this.groupRecordsByFamily(familyMembers)[0];
    } catch (error) {
      console.error('Error getting family tree:', error);
      return null;
    }
  }
}