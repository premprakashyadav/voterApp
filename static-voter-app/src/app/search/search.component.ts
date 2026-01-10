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
    { value: 1, label: 'Marathi' },
    { value: 2, label: 'English' }
    // { value: 'assembly_no', label: 'Assembly No' },
    // { value: 'part_no', label: 'Part No' },
    // { value: 'boothid', label: 'Booth ID' },
    //{ value: 'e_first_name', label: 'First Name' },
   // { value: 'e_last_name', label: 'Last Name' },
    // { value: 'e_middle_name', label: 'Middle Name' },
   // { value: 'vcardid', label: 'Voter Card ID' },
    // { value: 'e_assemblyname', label: 'Assembly Name' }
  ];

  // Enhanced browser detection
  isContactPickerSupported: boolean = false;
  isChromeIOS: boolean = false;
  isSafariIOS: boolean = false;
  browserInfo: string = '';

  firstname = '';
  middleName = '';
  lastname = '';
  voterId = '';
  searchValue: string = '';
  searchResults: Voter[] = [];
  mobileNumbers: { [key: string]: string } = {};
  isLoading: boolean = false;

  private pb = new PocketBase('https://corporatorelectionnew.onrender.com');
  selectedField: { value: number; label: string; } = this.searchFields[1];

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
    let mobileNumber = this.mobileNumbers[voter.id]
      ? this.mobileNumbers[voter.id]
      : voter.pd_receiving_date_no_1;
    if (!mobileNumber) {
      this.loading = false;
      return;
    }
    this.shareOnCommon(voter, 'sms', mobileNumber);
  }

  private showMessageOptions(voter: any): void {
    let mobileNumber = this.mobileNumbers[voter.id]
      ? this.mobileNumbers[voter.id]
      : voter.pd_receiving_date_no_1;
    if (!mobileNumber) {
      return;
    }
    // Clean the mobile number (remove spaces, dashes, etc.)
    let cleanNumber;
    cleanNumber = mobileNumber.toString();
    // cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/rJsAouPAE884okjx9';
    const message = `नमस्कार:
वॉर्ड: ${voter.constno}
अ. क्र: ${voter.vno}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
मतदान केंद्र: ${voter.polling_location}
निशाणी: कमळ
उमेदवार: श्री. किशोर नाना पाटील (प्रभाग क्रमांक:१०अ)
श्रीमती. एकता सिंह (डिंपल) (प्रभाग क्रमांक:१०ब)
श्रीमती. अंजू ह. तिवारी (प्रभाग क्रमांक:१०क)
श्री. पंकज दमयंती दत्तात्रेय देशमुख (प्रभाग क्रमांक:१०ड)
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

  // searchBasedPara(searchVal: any) {
  //   this.searchResults = this.voterService.searchVoters(
  //     this.selectedField,
  //     searchVal
  //   );
  //   if (this.searchResults.length === 0) {
  //     this.isSearched = true;
  //   } else {
  //     this.isSearched = false;
  //   }
  // }

async searchFamiliesDirect(payload: any): Promise<Record<string, any[]>> {

  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const buildCondition = (fieldName: string, value: string) => {
    const escaped = escapeRegex(value).replace(/"/g, '\\"');
    return `${fieldName} ~ "${escaped}"`;
  };

  let searchConditions = '';

  /* =======================
     CASE 1: Voter ID search
     ======================= */
  if (payload.voterId) {
    searchConditions = buildCondition('cardno', payload.voterId.trim());
  }

  /* ==========================
     CASE 2: Name-based search
     ========================== */
  else {
    const nameConditions: string[] = [];
    

    if (payload?.hname) {
      nameConditions.push(
        buildCondition('hname', payload.hname.trim())
      );
    }

        if (payload.name_english) {
      nameConditions.push(
        buildCondition('name_english', payload.name_english.trim())
      );
    }

    if (payload.relative) {
      nameConditions.push(
        buildCondition('relative', payload.relative.trim())
      );
    }

      if (payload.relative_english) {
      nameConditions.push(
        buildCondition('relative_english', payload.relative_english.trim())
      );
    }

        if (payload.surname) {
      nameConditions.push(
        buildCondition('surname', payload.surname.trim()),
      );
    }

    if (payload.esurname) {
      nameConditions.push(
        buildCondition('esurname', payload.esurname.trim())
      );
    }

    if (nameConditions.length === 0) {
      throw new Error('No valid search fields provided');
    }

    searchConditions = nameConditions.join(' && ');
  }

  try {
    const allMatchingMembers = await this.pb
      .collection('corporatorElectionData')
      .getFullList({
        filter: `(${searchConditions}) && familyqty >= 1`,
        sort: 'familycode, name',
      });

    /* ================
       Group by family
       ================ */
    const groupedByFamily: Record<string, any[]> = {};

    allMatchingMembers.forEach((member: any) => {
      const code = member.familycode.toString();
      if (!groupedByFamily[code]) groupedByFamily[code] = [];
      groupedByFamily[code].push(member);
    });

    return groupedByFamily;
  } catch (error: any) {
    console.error('Search error details:', {
      message: error.message,
      status: error.status,
      data: error.data,
    });
    throw error;
  }
}


onSearch() {
  let payload: any = {};

  /* ======================
     PRIORITY: VOTER ID
     ====================== */
  if (this.voterId) {
    payload.voterId = this.voterId.trim();

    // reset others
    this.firstname = '';
    this.middleName = '';
    this.lastname = '';
  }

  /* ======================
     NAME BASED SEARCH
     ====================== */
  else {
    if (this.selectedField.value === 1) {
    // Marathi
    if (this.firstname) {
      payload.hname = this.firstname.trim();
    }

    if (this.middleName) {
      payload.relative = this.middleName.trim();
    }

    if (this.lastname) {
      payload.surname = this.lastname.trim();
    }
    }

    else if (this.selectedField.value === 2) {
    // English
    if (this.firstname) {
      payload.name_english = this.firstname.trim();
    }

    if (this.middleName) {
      payload.relative_english = this.middleName.trim();
    }

    if (this.lastname) {
      payload.esurname = this.lastname.trim();
    }
    }

    // reset unused fields
    this.firstname = payload.hname || payload.name_english ? this.firstname : '';
    this.middleName = payload.relative || payload.relative_english ? this.middleName : '';
    this.lastname = payload.surname || payload.esurname ? this.lastname : '';
  }

  /* ======================
     VALIDATION
     ====================== */
  if (Object.keys(payload).length === 0) {
    this.isSearched = true;
    this.searchResults = [];
    return;
  }

  /* ======================
     API CALL
     ====================== */
  //this.searchFamiliesDirect(payload);
  this.spinner.show();
              this.searchFamiliesDirect(payload)
          .then((resultsGrouped) => {
            this.firstname = '';
            this.middleName = '';
            this.lastname = '';
            this.voterId =  '';
            // Flatten all members into a single array
            this.searchResults = Object.values(resultsGrouped).flat();
            this.isSearched = this.searchResults.length === 0;
            this.spinner.hide();
          })
          .catch((error) => {
            console.error('Search error:', error);
            this.searchResults = [];
            this.isSearched = true;
            this.spinner.hide();
          });

}


  onMobileNumberChange(voterId: string, number: string): void {
    this.mobileNumbers[voterId] = number;
  }

  shareAllOnWhatsApp(voter: Voter): void {
    let mobileNumber = this.mobileNumbers[voter.id]
      ? this.mobileNumbers[voter.id]
      : voter.pd_receiving_date_no_1;
    if (!mobileNumber) return;
    this.shareOnCommon(voter, 'whatsapp', mobileNumber);
  }

  shareOnCommon(voter: Voter, type: string, mobileNumber: string): void {
    if (!mobileNumber) return;
    // Clean the mobile number (remove spaces, dashes, etc.)
    let mobileNumberNew = mobileNumber.toString();
    mobileNumberNew = mobileNumberNew.replace(/\s+/g, '');
    let cleanNumber;
    cleanNumber = mobileNumberNew.toString();
    // cleanNumber = mobileNumber.replace(/\D/g, '');
    const imageUrl = 'https://photos.app.goo.gl/rJsAouPAE884okjx9';
    const message = `नमस्कार:
वॉर्ड: ${voter.constno}
अ. क्र: ${voter.vno}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
मतदान केंद्र: ${voter.polling_location}
निशाणी: कमळ
उमेदवार: श्री. किशोर नाना पाटील (प्रभाग क्रमांक:१०अ)
श्रीमती. एकता सिंह (डिंपल) (प्रभाग क्रमांक:१०ब)
श्रीमती. अंजू ह. तिवारी (प्रभाग क्रमांक:१०क)
श्री. पंकज दमयंती दत्तात्रेय देशमुख (प्रभाग क्रमांक:१०ड)
भारतीय जनता पार्टी
${imageUrl}`;
    let whatsappUrl;
    let encodedMessage;
    if (type === 'sms') {
      // Send SMS
      encodedMessage = message;
      this.pb.collection('corporatorElectionData').update(voter.id, {
        smsSharedNumber: Number(cleanNumber),
      });
      this.smsService.send(cleanNumber, encodedMessage);
      this.sent.emit({ phone: cleanNumber, method: 'sms' });
    } else if (type === 'whatsapp') {
      encodedMessage = encodeURIComponent(message);
            this.pb.collection('corporatorElectionData').update(voter.id, {
        whatsappSharedNumber: Number(cleanNumber),
      });
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
    return !!number && (number?.trim().length >= 10 || number.length >= 10);
  }

  clearSearch(): void {
    this.selectedField = this.searchFields[1];
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
    const imageUrl = 'https://photos.app.goo.gl/rJsAouPAE884okjx9';
    const message = `नमस्कार:
वॉर्ड: ${voter.constno}
अ. क्र: ${voter.vno}
मतदाता नाव: ${voter.name}
भाग क्रमांक: ${voter.booth.split('/')[1]}
मतदान कार्ड: ${voter.cardno}
मतदान केंद्र: ${voter.polling_location}
निशाणी: कमळ
उमेदवार: श्री. किशोर नाना पाटील (प्रभाग क्रमांक:१०अ)
श्रीमती. एकता सिंह (डिंपल) (प्रभाग क्रमांक:१०ब)
श्रीमती. अंजू ह. तिवारी (प्रभाग क्रमांक:१०क)
श्री. पंकज दमयंती दत्तात्रेय देशमुख (प्रभाग क्रमांक:१०ड)
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

  searchLang(event: any) {
    debugger;
    const selectedValue = event.target.value;
    this.selectedField = this.searchFields.find(
      (field) => field.value === Number(selectedValue)
    )!;
  }

}
