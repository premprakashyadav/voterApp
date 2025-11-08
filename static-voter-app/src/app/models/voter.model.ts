export interface Voter {
  age: number;
  assembly_no: number;
  booth_no: number;
  boothid: number;
  collectionId: string;
  collectionName: string;
  created: string;
  draft_srno: number;
  e_address: string;
  e_assemblyname: string;
  e_boothaddress: string;
  e_first_name: string;
  e_last_name: string;
  e_middle_name: string;
  e_taluka: string;
  e_village: string;
  house_no: string;
  id: string;
  l_address: string;
  l_assemblyname: string;
  l_boothaddress: string;
  l_first_name: string;
  l_last_name: string;
  l_middle_name: string;
  l_taluka: string;
  l_village: string;
  part_no: number;
  sex: string;
  srno: number;
  updated: string;
  vcardid: string;
  voted: string;
}

export interface FavoriteList {
  id: string;
  name: string;
  voters: Voter[];
  created: Date;
}