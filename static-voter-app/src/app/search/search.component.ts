import { Component, OnInit } from '@angular/core';
import { VoterService } from '../services/voter.service';
import { Voter } from '../models/voter.model';

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

  constructor(private voterService: VoterService) {}

  ngOnInit(): void {
    // Enhanced browser detection
    this.detectBrowserAndCapabilities();
    this.isLoading = true;
    this.voterService.loadVotersData().subscribe({
      next: (data) => {
        this.isLoading = false;
        console.log('Loaded voters data:', data.length);
      },
      error: (error) => {
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

  onSearch(): void {
    if (this.firstname) {
      this.selectedField = 'e_first_name';
      this.searchBasedPara(this.firstname);
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

  shareOnWhatsApp(voter: Voter): void {
    const mobileNumber = this.mobileNumbers[voter.id];
    if (!mobileNumber) return;

    // Clean the mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/dyZYH6Akt9bAv1Nh8';
    const message = `नमस्कार:
मतदाता क्रमांक: ${voter.vcardid}
यादिभाग क्रमांक: ${voter.part_no}
मतदाता नाव: ${voter.e_first_name} ${voter.e_middle_name} ${voter.e_last_name}
विधानसभा क्रमांक: ${voter.e_assemblyname}
मतदान केंद्र: ${voter.boothid}  ${voter.e_address}
निशाणी: कमळ
उमेदवार: पंकज डी. देशमुख
भारतीय जनता पार्टी
${imageUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/+91${cleanNumber}?text=${encodedMessage}`;

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
        const phoneNumber = contact;

        if (phoneNumber) {
          this.onMobileNumberChange(voterId, phoneNumber);
          //this.showToast(`Selected: ${contact.name || 'Contact'}`, 'success');
          alert(`Selected: ${contact.name || 'Contact'}`);
        } else {
          // this.showToast('No phone number found in selected contact', 'warning');
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
    const imageUrl = 'https://photos.app.goo.gl/dyZYH6Akt9bAv1Nh8';
    const message = `नमस्कार:
मतदाता क्रमांक: ${voter.vcardid}
यादिभाग क्रमांक: ${voter.part_no}
मतदाता नाव: ${voter.e_first_name} ${voter.e_middle_name} ${voter.e_last_name}
विधानसभा क्रमांक: ${voter.e_assemblyname}
मतदान केंद्र: ${voter.boothid}  ${voter.e_address}
निशाणी: कमळ
उमेदवार: पंकज डी. देशमुख
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
