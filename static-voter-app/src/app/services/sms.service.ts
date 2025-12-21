// services/sms.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  
  /**
   * Send SMS - Universal method for all platforms
   */
  send(phone: string, message: string, options?: {
    encode?: boolean;
    fallback?: 'whatsapp' | 'telegram' | 'copy';
  }): void {
    const config = {
      encode: true,
      fallback: 'whatsapp',
      ...options
    };
    
    const encodedMsg = config.encode ? encodeURIComponent(message) : message;
    const cleanPhone = this.formatPhoneNumber(phone);
    
    // Platform detection
    const platform = this.getPlatform();
    
    switch(platform) {
      case 'ios':
      case 'android':
        // Mobile - SMS works
        window.location.href = `sms:${cleanPhone}?body=${encodedMsg}`;
        break;
        
      case 'mac':
        // Mac - SMS via Messages.app
        window.location.href = `sms:${cleanPhone}?body=${encodedMsg}`;
        break;
        
      default:
        // Desktop - use fallback
        this.useFallback(cleanPhone, message, config.fallback!);
    }
  }
  
  /**
   * Send to multiple recipients
   */
  sendBulk(recipients: Array<{phone: string; name?: string}>, 
           messageTemplate: string,
           delayMs: number = 500): void {
    recipients.forEach((recipient, index) => {
      setTimeout(() => {
        const personalizedMsg = messageTemplate.replace('{{name}}', recipient.name || '');
        this.send(recipient.phone, personalizedMsg);
      }, index * delayMs);
    });
  }
  
  /**
   * Get all available messaging options
   */
  getOptions(phone: string, message: string): Array<{
    id: string;
    name: string;
    icon: string;
    url: string;
    color: string;
  }> {
    const cleanPhone = this.formatPhoneNumber(phone);
    const encodedMsg = encodeURIComponent(message);
    
    return [
      {
        id: 'sms',
        name: 'SMS',
        icon: '📱',
        url: `sms:${cleanPhone}?body=${message}`,
        color: '#3498db'
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: '📨',
        url: `https://t.me/share/url?url=&text=${encodedMsg}`,
        color: '#0088cc'
      },
      {
        id: 'signal',
        name: 'Signal',
        icon: '📡',
        url: `https://signal.me/#p/${cleanPhone}`,
        color: '#3a76f0'
      },
      {
        id: 'email',
        name: 'Email',
        icon: '📧',
        url: `mailto:?subject=Message&body=${encodeURIComponent(`To: ${phone}\n\n${message}`)}`,
        color: '#EA4335'
      }
    ];
  }
  
  private getPlatform(): string {
    const ua = navigator.userAgent;
    
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Mac/i.test(ua)) return 'mac';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Linux/i.test(ua)) return 'linux';
    
    return 'desktop';
  }
  
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except plus
    return phone.replace(/[^\d+]/g, '');
  }
  
  private useFallback(phone: string, message: string, method: string): void {
    const encodedMsg = encodeURIComponent(message);
    
    switch(method) {
      case 'whatsapp':
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=&text=${encodedMsg}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`To: ${phone}\n\n${message}`);
        alert('Message copied to clipboard!');
        break;
    }
  }
}