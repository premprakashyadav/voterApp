import { Component, Input, OnInit, output } from '@angular/core';
import { VoterService } from '../services/voter.service';
import { Voter } from '../models/voter.model';
import PocketBase from 'pocketbase';
import { NgxSpinnerService } from 'ngx-spinner';
import { SmsService } from '../services/sms.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  @Input() phone: string = '';
  @Input() message: string = '';
  @Input() text: string = 'Send SMS';
  @Input() icon: string = '📱';
  @Input() buttonClass: string = 'btn btn-warning ms-2';
  @Input() disabled: boolean = false;
  @Input() showAllOptions: boolean = false;
  loading = false;
  showOptions = false;
  options: any[] = [];

  sent = output<{ phone: string; method: string }>();
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

  constructor(
    private voterService: VoterService,
    private spinner: NgxSpinnerService,
    private smsService: SmsService
  ) {}

  ngOnInit(): void {
    // Enhanced browser detection
    this.detectBrowserAndCapabilities();
  }

  onClick(voter: any): void {
    if (!voter.id) return;
  //  if (this.disabled || this.loading) return;

    const isMobile = this.isMobileDevice();

    if (isMobile && !this.showAllOptions) {
      // Mobile - send SMS directly
      this.sendDirectSMS(voter);
    } else {
      // Show all options
      this.showMessageOptions(voter);
    }
  }

  private sendDirectSMS(voter: any): void {
    this.loading = true;
    this.shareOnCommon(voter, 'sms');
  }

  private showMessageOptions(voter: any): void {
    this.onMobileNumberChange(voter.id, voter.Mobile);
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;
    // Clean the mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/UQAjr436EscrhTLo7';
    const message = `नमस्कार:
यादी भाग क्र.: ${voter.yadibhag}
वॉर्ड / कॉलेज /विभाग क्रमांक: ${voter.constno}
अ. क्र: ${voter.vno}
विधानसभा: ${voter.booth.split('/')[0]}
अनुक्रमांक भागात: ${voter.booth.split('/')[2]}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
पत्ता: ${voter.addressN}
निशाणी: कमळ
उमेदवार: पंकज दमयंती दत्तात्रेय देशमुख
भारतीय जनता पार्टी
${imageUrl}`;
    const encodedMessage = message;
    this.options = this.smsService.getOptions(cleanNumber, encodedMessage);
    this.showOptions = true;
  }

  selectOption(method: string): void {
    this.sent.emit({ phone: this.phone, method });
    this.closeOptions();
  }

  closeOptions(): void {
    this.showOptions = false;
  }

  private isMobileDevice(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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

async searchFamiliesDirect(query: string, field: string): Promise<any> {
    const searchableFields = [
      'name',
      'hname',
      'esurname',
      'surname',
      'name_english',
      'address',
      'Mobile',
      'cardno',
    ];

    // Helper function to safely build filter conditions
   const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCondition = (fieldName: string, value: string) => {
  const escaped = escapeRegex(value).replace(/"/g, '\\"');
  return `${fieldName} ~ "${escaped}"`;
};

    let searchConditions = '';

    switch (field) {
      case 'firstname':
        searchConditions = `${buildCondition('name',query)} || ${buildCondition('hname',query)} || ${buildCondition('name_english', query)}`;;
        break;
      case 'lastName':
       searchConditions = `${buildCondition('surname',query)} || ${buildCondition('esurname', query)}`;
        break;
      case 'voterId':
        searchConditions = buildCondition('cardno', query);
        break;
      default:
        searchConditions = searchableFields
          .map((fieldName) => buildCondition(fieldName, query))
          .join(' || ');
    }

    const familyFilter = `(${searchConditions}) && familyqty >= 1`;

    try {
      const matchingRecords = await this.pb
        .collection('corporatorElectionData')
        .getFullList({
          filter: familyFilter,
          fields: 'familycode',
        });

      const familyCodes = [
        ...new Set(matchingRecords.map((r: any) => r.familycode)),
      ];

      if (familyCodes.length === 0) return [];

      const familyCodeFilter = familyCodes
        .map((code) => `familycode = "${code.replace(/"/g, '\\"')}"`)
        .join(' || ');

      const allFamilyMembers = await this.pb
        .collection('corporatorElectionData')
        .getFullList({
          filter: familyCodeFilter,
          sort: 'familycode, name',
        });

      return allFamilyMembers;
    } catch (error: any) {
      console.error('Search error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        filter: familyFilter,
      });
      throw error;
    }
  }


  onSearch(): void {
    if (this.firstname) {
      this.lastname = '';
      this.voterId = '';
      this.spinner.show();
      this.searchFamiliesDirect(this.firstname, 'firstname')
        .then((results) => {
          this.searchResults = results;
          this.isSearched = results.length === 0;
          this.spinner.hide();
        })
        .catch((error) => {
          console.error('Search error:', error);
          this.isSearched = true;
          this.searchResults = [];
          this.spinner.hide();
        });
    } else if (this.lastname) {
      this.firstname = '';
      this.voterId = '';
      this.spinner.show();
      this.searchFamiliesDirect(this.lastname, 'lastName')
        .then((results) => {
          this.searchResults = results;
          this.isSearched = results.length === 0;
          this.spinner.hide();
        })
        .catch((error) => {
          console.error('Search error:', error);
          this.isSearched = true;
          this.searchResults = [];
          this.spinner.hide();
        });
    } else if (this.voterId) {
      this.firstname = '';
      this.lastname = '';
      this.spinner.show();
      this.searchFamiliesDirect(this.voterId, 'voterId')
        .then((results) => {
          this.searchResults = results;
          this.isSearched = results.length === 0;
          this.spinner.hide();
        })
        .catch((error) => {
          console.error('Search error:', error);
          this.isSearched = true;
          this.searchResults = [];
          this.spinner.hide();
        });
    } else {
      this.isSearched = true;
      this.searchResults = [];
    }
  }

  onMobileNumberChange(voterId: string, number: string): void {
    this.mobileNumbers[voterId] = number;
  }

  shareAllOnWhatsApp(voter: Voter): void {
    this.onMobileNumberChange(voter.id, voter.Mobile);
    // let sameFamilyData = this.searchResults.filter(
    //   (v) => v.familycode === voter.familycode
    // );
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;
    this.shareOnCommon(voter, 'whatsapp');
    // sameFamilyData.forEach((familyVoter) => {
    //   this.shareOnWhatsApp(familyVoter);
    // });
  }

  shareOnCommon(voter: Voter, type: string): void {
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;
    // Clean the mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/UQAjr436EscrhTLo7';
    const message = `नमस्कार:
यादी भाग क्र.: ${voter.yadibhag}
वॉर्ड / कॉलेज /विभाग क्रमांक: ${voter.constno}
अ. क्र: ${voter.vno}
विधानसभा: ${voter.booth.split('/')[0]}
अनुक्रमांक भागात: ${voter.booth.split('/')[2]}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
पत्ता: ${voter.addressN}
निशाणी: कमळ
उमेदवार: पंकज दमयंती दत्तात्रेय देशमुख
भारतीय जनता पार्टी
${imageUrl}`;
    let whatsappUrl;
    let encodedMessage;
    if (type === 'sms') {
      // Send SMS
      encodedMessage = message;
      this.smsService.send(cleanNumber, encodedMessage);
      this.sent.emit({ phone: cleanNumber, method: 'sms' });
    } else if (type === 'whatsapp') {
      encodedMessage = encodeURIComponent(message);
      if (cleanNumber.length > 10 && cleanNumber.startsWith('91')) {
        whatsappUrl = `https://wa.me/+${cleanNumber}?text=${encodedMessage}`;
      } else if (cleanNumber.length === 10) {
        whatsappUrl = `https://wa.me/+91${cleanNumber}?text=${encodedMessage}`;
      }

      window.open(whatsappUrl, '_blank');
    }
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
विधानसभा: ${voter.booth.split('/')[0]}
अनुक्रमांक भागात: ${voter.booth.split('/')[2]}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
पत्ता: ${voter.addressN}
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
   // const encodedMessage = encodeURIComponent(message);

    // WhatsApp API URL without phone number
    const whatsappUrl = `https://wa.me/?text=${message}`;

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
