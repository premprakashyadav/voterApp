import { Component, OnInit } from '@angular/core';
import { VoterService } from '../services/voter.service';
import { Voter } from '../models/voter.model';
import PocketBase from 'pocketbase';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  isSearched = false;
  searchFields = [
    // { value: 'assembly_no', label: 'Assembly No' },
    // { value: 'part_no', label: 'Part No' },
    // { value: 'boothid', label: 'Booth ID' },
    { value: 'e_first_name', label: 'First Name' },
    { value: 'e_last_name', label: 'Last Name' },
    // { value: 'e_middle_name', label: 'Middle Name' },
    { value: 'vcardid', label: 'Voter Card ID' },
    // { value: 'e_assemblyname', label: 'Assembly Name' }
  ];

  // Enhanced browser detection
  isContactPickerSupported: boolean = false;
  isChromeIOS: boolean = false;
  isSafariIOS: boolean = false;
  browserInfo: string = '';

  selectedField: string = '';
  firstname = '';
  lastname = '';
  voterId = '';
  searchValue: string = '';
  searchResults: Voter[] = [];
  mobileNumbers: { [key: string]: string } = {};
  isLoading: boolean = false;

  private pb = new PocketBase('https://corporatorelection.onrender.com');

  private searchableFields = [
    'constno',
    'yadibhag',
    'vno',
    'age',
    'hno',
    'name',
    'hname',
    'name_english',
    'surname',
    'esurname',
    'sex',
    'cardno',
    'relative',
    'relative_english',
    'relation',
    'address',
    'entrytype',
    'familycode',
    'familyqty',
    'section_no',
    'caste',
    'deadalive',
    'Dubar',
    'mobileOld',
    'email',
    'shifted',
    'blood',
    'societyno',
    'partyno',
    'keypersonno',
    'redgreen',
    'leaderno',
    'coleaderno',
    'oppleaderno',
    'voting',
    'booth',
    'dubarcode',
    'adhar',
    'ration',
    'senior',
    'lat',
    'lon',
    'gaddress',
    'addressN',
    'Mobile',
  ];

  constructor(private voterService: VoterService) {}

  ngOnInit(): void {
    // Enhanced browser detection
    this.detectBrowserAndCapabilities();
    this.isLoading = true;
    this.voterService.loadVotersData().subscribe({
      next: (data: any) => {
        this.isLoading = false;
        console.log('Loaded voters data:', data.length);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
      },
    });
  }

  searchBasedPara(searchVal: any) {
    this.searchResults = this.voterService.searchVoters(
      this.selectedField,
      searchVal
    );
    if (this.searchResults.length === 0) {
      this.isSearched = true;
    } else {
      this.isSearched = false;
    }
  }

  async searchFamiliesDirect(query: string): Promise<any> {
    // This complex filter finds families where:
    // 1. Any member matches the search query
    // 2. familyqty > 1
    // 3. Returns all members of matching families

    const searchableFields = [
      'name',
      'surname',
      'name_english',
      'address',
      'Mobile',
      'cardno',
    ];

    // Build search condition for any field
    const searchConditions = searchableFields
      .map((field) => `${field} ~ "${query}"`)
      .join(' || ');

    // Find family codes where at least one member matches AND familyqty > 1
    const familyFilter = `(${searchConditions}) && familyqty > 1`;

    try {
      // First, find matching records with familyqty > 1
      const matchingRecords = await this.pb
        .collection('corporatorElectionData')
        .getFullList({
          filter: familyFilter,
          fields: 'familycode',
        });

      // Extract unique family codes
      const familyCodes = [
        ...new Set(matchingRecords.map((r) => r['familycode'])),
      ];

      if (familyCodes.length === 0) {
        return [];
      }

      // Get ALL members of these families
      const familyCodeFilter = familyCodes
        .map((code) => `familycode = "${code}"`)
        .join(' || ');

      const allFamilyMembers = await this.pb
        .collection('corporatorElectionData')
        .getFullList({
          filter: familyCodeFilter,
          sort: 'familycode, name',
        });

      return allFamilyMembers;
    } catch (error) {
      console.error('Direct family search error:', error);
      throw error;
    }
  }

  onSearch(): void {
    if (this.firstname) {
      this.selectedField = 'e_first_name';
      // this.searchBasedPara(this.firstname);
      this.searchFamiliesDirect(this.firstname)
        .then((results) => {
          this.searchResults = results;
          this.isSearched = results.length === 0;
        })
        .catch((error) => {
          console.error('Search error:', error);
          this.isSearched = true;
          this.searchResults = [];
        });
    } else if (this.lastname) {
      this.selectedField = 'e_last_name';
      this.searchBasedPara(this.lastname);
    } else if (this.voterId) {
      this.selectedField = 'vcardid';
      this.searchBasedPara(this.voterId);
    } else {
      this.isSearched = true;
      this.searchResults = [];
    }
  }

  onMobileNumberChange(voterId: string, number: string): void {
    this.mobileNumbers[voterId] = number;
  }

  shareAllOnWhatsApp(voter: Voter): void {
    let sameFamilyData = this.searchResults.filter(
      (v) => v.familycode === voter.familycode
    );
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;
    sameFamilyData.forEach((familyVoter) => {
      this.shareOnWhatsApp(familyVoter);
    });
  }

  shareOnWhatsApp(voter: Voter): void {
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;
    // Clean the mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/UQAjr436EscrhTLo7';
    const message = `नमस्कार:
यादी भाग क्र.: ${voter.yadibhag}
वॉर्ड / कॉलेज /विभाग क्रमांक: ${voter.constno}
अ. क्र: ${voter.vno}
विधानसभा निर्वाचन क्षेत्र संख्या: ${voter.booth.split('/')[0]}
अनुक्रमांक भागात: ${voter.booth.split('/')[2]}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
मतदान केंद्र: ${voter.address}
वय: ${voter.age}
लिंग: ${voter.sex}
पत्ता: ${voter.addressN}
रिलेटीव चे नाव: ${voter.relative}
निशाणी: कमळ
उमेदवार: पंकज दमयंती दत्तात्रेय देशमुख
भारतीय जनता पार्टी
${imageUrl}`;
    let whatsappUrl;
    const encodedMessage = encodeURIComponent(message);
    if (cleanNumber.length > 10 && cleanNumber.startsWith('91')) {
      whatsappUrl = `https://wa.me/+${cleanNumber}?text=${encodedMessage}`;
    } else if (cleanNumber.length === 10) {
      whatsappUrl = `https://wa.me/+91${cleanNumber}?text=${encodedMessage}`;
    }

    window.open(whatsappUrl, '_blank');
  }

  // Export filtered data
  exportData(): void {
    let filter = '';
    if (this.selectedField && this.searchValue) {
      filter = `${this.selectedField} ~ "${this.searchValue}"`;
    }
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

  // Enhanced browser detection
  private detectBrowserAndCapabilities(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Detect Chrome on iOS
    this.isChromeIOS =
      userAgent.includes('crios/') ||
      (userAgent.includes('chrome') && userAgent.includes('iphone')) ||
      userAgent.includes('ipad');

    // Detect Safari on iOS
    this.isSafariIOS =
      userAgent.includes('safari') &&
      !userAgent.includes('chrome') &&
      (userAgent.includes('iphone') || userAgent.includes('ipad'));

    // Check Contact Picker API support (will be false on iOS)
    this.isContactPickerSupported =
      'contacts' in navigator &&
      'select' in (navigator && (navigator.contacts as any));

    // Set browser info for debugging
    if (this.isChromeIOS) {
      this.browserInfo = 'Chrome on iOS';
      console.log('Browser: Chrome iOS - Contact Picker NOT supported');
    } else if (this.isSafariIOS) {
      this.browserInfo = 'Safari on iOS';
      console.log('Browser: Safari iOS - Contact Picker NOT supported');
    } else if (this.isContactPickerSupported) {
      this.browserInfo = 'Supported Browser';
      console.log('Browser: Contact Picker supported');
    } else {
      this.browserInfo = 'Other Browser';
      console.log('Browser: Contact Picker NOT supported');
    }
  }

  // Enhanced contact picker with iOS-specific fallbacks
  async openContactPicker(voterId: string): Promise<void> {
    // Special handling for iOS browsers
    if (this.isChromeIOS || this.isSafariIOS) {
      this.showIOSContactInstructions(voterId);
      return;
    }

    // Original contact picker logic for supported browsers
    if (this.isContactPickerSupported) {
      await this.openNativeContactPicker(voterId);
    } else {
      this.showContactPickerFallback(voterId);
    }
  }

  // Native contact picker for supported browsers
  private async openNativeContactPicker(voterId: string): Promise<void> {
    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: false }
      );

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];

        // Extract phone number from contact object
        let phoneNumber: any = '';

        if (contact.tel && contact.tel.length > 0) {
          // Get the first phone number
          phoneNumber = contact.tel[0];

          // If it's an object with properties, try to get the value
          if (typeof phoneNumber === 'object') {
            phoneNumber =
              phoneNumber?.number ||
              phoneNumber?.value ||
              phoneNumber?.toString();
          }
        }

        if (phoneNumber) {
          // Clean the phone number (remove non-digit characters)
          const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');

          this.onMobileNumberChange(voterId, cleanedPhoneNumber);
          alert(
            `Selected: ${contact.name || 'Contact'} - ${cleanedPhoneNumber}`
          );
        } else {
          alert('No phone number found in selected contact');
        }
      }
    } catch (error: any) {
      console.error('Contact picker error:', error);
      this.showContactPickerFallback(voterId);
    }
  }

  // Special instructions for iOS users
  private showIOSContactInstructions(voterId: string): void {
    const instructions = `
📱 How to add phone number on iOS:

OPTION 1 - Copy from Contacts:
1. Open your Phone app
2. Go to Contacts
3. Find and tap the contact
4. Tap and hold the phone number
5. Select "Copy"
6. Return here and paste in the field above

OPTION 2 - Type manually:
Simply type the number in the input field

OPTION 3 - Use Recent Calls:
1. Open Phone app → Recents
2. Find the number
3. Tap the (i) icon
4. Copy the number
5. Paste it here
    `;

    // Show custom modal or use confirm with better formatting
    if (
      confirm(
        'Contact picker not available on iOS.\n\nWould you like to see detailed instructions?'
      )
    ) {
      // You could replace this with a proper modal
      alert(instructions);
    }

    // Always focus on the input field for quick access
    this.focusOnMobileInput(voterId);
  }

  // Focus on mobile input field
  private focusOnMobileInput(voterId: string): void {
    setTimeout(() => {
      const inputElement = document.querySelector(
        `[data-voter-id="${voterId}"]`
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select(); // Select all text for easy replacement
      }
    }, 100);
  }

  // Enhanced fallback with iOS-specific tips
  private showContactPickerFallback(voterId: string): void {
    const isIOS = this.isChromeIOS || this.isSafariIOS;

    if (isIOS) {
      this.showIOSContactInstructions(voterId);
    } else {
      const instructions = `
How to add phone number:

1. Open your phone's Contacts app
2. Find the contact you want to share with
3. Copy the phone number
4. Paste it in the input field above

Or simply type the number manually.
      `;
      alert('Contact picker not available.\n\n' + instructions);
      this.focusOnMobileInput(voterId);
    }
  }

  shareOnWhatsAppWithoutNumber(voter: Voter): void {
    const message = this.generateWhatsAppMessage(voter);
    this.openWhatsAppWithMessage(message);
  }

  generateWhatsAppMessage(voter: Voter) {
    const imageUrl = 'https://photos.app.goo.gl/UQAjr436EscrhTLo7';
    const message = `नमस्कार:
यादी भाग क्र.: ${voter.yadibhag}
वॉर्ड / कॉलेज /विभाग क्रमांक: ${voter.constno}
अ. क्र: ${voter.vno}
विधानसभा निर्वाचन क्षेत्र संख्या: ${voter.booth.split('/')[0]}
अनुक्रमांक भागात: ${voter.booth.split('/')[2]}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
मतदान केंद्र: ${voter.address}
वय: ${voter.age}
लिंग: ${voter.sex}
पत्ता: ${voter.addressN}
रिलेटीव चे नाव: ${voter.relative}
निशाणी: कमळ
उमेदवार: पंकज दमयंती दत्तात्रेय देशमुख
भारतीय जनता पार्टी
${imageUrl}`;
    const encodedMessage = encodeURIComponent(message);
    return encodedMessage;
  }

  // Open WhatsApp with pre-filled message
  private openWhatsAppWithMessage(message: string): void {
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp API URL without phone number
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open in new window
    const windowFeatures = 'width=600,height=700,scrollbars=yes,resizable=yes';
    const newWindow = window.open(whatsappUrl, '_blank', windowFeatures);

    // Fallback if popup is blocked
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed == 'undefined'
    ) {
      // Fallback to same tab
      window.location.href = whatsappUrl;
    }
    // Track the share event
    this.trackShareEvent('whatsapp_without_number');
  }

  // Track sharing events (optional analytics)
  private trackShareEvent(type: string): void {
    console.log(`Share event: ${type} at ${new Date().toISOString()}`);

    // You can integrate with analytics services here
    // Example: Google Analytics, etc.
  }
}
