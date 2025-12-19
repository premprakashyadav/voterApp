export interface Voter {
  collectionId: string;
  collectionName: string;
  id: string;
  created: string;
  updated: string;
  
  // Custom fields
  constno: number;
  yadibhag: number;
  vno: number;
  age: number;
  hno: string;
  name: string;
  hname: string;
  name_english: string;
  surname: string;
  esurname: string;
  sex: string;
  cardno: string;
  relative: string;
  relative_english: string;
  relation: string;
  address: string;
  entrytype: string;
  familycode: string;
  familyqty: string;
  section_no: string;
  caste: string;
  deadalive: string;
  Dubar: string;
  mobileOld: string;
  email: string;
  shifted: string;
  blood: string;
  societyno: string;
  partyno: string;
  keypersonno: string;
  redgreen: string;
  leaderno: string;
  coleaderno: string;
  oppleaderno: string;
  voting: string;
  booth: string;
  dubarcode: string;
  adhar: string;
  ration: string;
  senior: string;
  lat: string;
  lon: string;
  gaddress: string;
  addressN: string;
  Mobile: string;
}

export interface FavoriteList {
  id: string;
  name: string;
  voters: Voter[];
  created: Date;
}

export const voterList: Voter[] = [];
