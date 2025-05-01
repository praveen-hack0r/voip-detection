import axios from 'axios';
import { InsertNumberMetadata } from '@shared/schema';

interface PhoneLookupResult {
  phoneNumber: string;
  countryCode: string;
  location: string;
  carrier: string;
  lineType: string;
  isValid: boolean;
  riskScore: number;
  isPossibleFraud: boolean;
}

export class PhoneService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.PHONE_LOOKUP_API_KEY || 'demo_key';
  }
  
  /**
   * Lookup phone number information using an external API
   */
  async lookupPhoneNumber(phoneNumber: string): Promise<PhoneLookupResult> {
    try {
      // Validate phone number format
      const sanitizedNumber = phoneNumber.replace(/\D/g, '');
      
      if (!sanitizedNumber || sanitizedNumber.length < 8) {
        throw new Error('Invalid phone number format');
      }
      
      // Use NumVerify, Twilio Lookup, or similar API in production
      // For this implementation, we'll simulate the API response
      
      // In a real implementation, this would be an actual API call:
      // const response = await axios.get(`https://api.phonevalidator.com/v1/verify?phone=${sanitizedNumber}&api_key=${this.apiKey}`);
      
      // Simulating API response based on phone number patterns
      const countryCode = this.determineCountryCode(sanitizedNumber);
      const isVoip = this.isLikelyVoip(sanitizedNumber);
      const location = this.determineLocation(countryCode);
      const carrier = this.determineCarrier(isVoip, sanitizedNumber);
      const riskScore = this.calculateRiskScore(sanitizedNumber, isVoip);
      
      return {
        phoneNumber: this.formatPhoneNumber(sanitizedNumber, countryCode),
        countryCode,
        location,
        carrier,
        lineType: isVoip ? 'VoIP' : 'Mobile/Landline',
        isValid: true,
        riskScore,
        isPossibleFraud: riskScore > 70
      };
    } catch (error) {
      console.error('Error in phone lookup:', error);
      throw new Error('Failed to lookup phone number information');
    }
  }
  
  /**
   * Detect likely VoIP service provider from phone number pattern
   */
  async detectProvider(phoneNumber: string): Promise<string> {
    // This is a simplified implementation
    // In a real app, this would use a database of known VoIP providers and their number ranges
    
    const sanitizedNumber = phoneNumber.replace(/\D/g, '');
    
    // Some basic detection logic
    if (sanitizedNumber.startsWith('1800') || sanitizedNumber.startsWith('1888')) {
      return 'Toll-Free / Various Providers';
    }
    
    if (sanitizedNumber.includes('12345')) {
      return 'Twilio';
    }
    
    if (sanitizedNumber.includes('55555')) {
      return 'Vonage';
    }
    
    if (sanitizedNumber.endsWith('9999')) {
      return 'Skype';
    }
    
    if (sanitizedNumber.includes('8080')) {
      return 'RingCentral';
    }
    
    return 'Unknown Provider';
  }
  
  /**
   * Format phone number metadata for storage
   */
  async formatForStorage(phoneData: PhoneLookupResult): Promise<InsertNumberMetadata> {
    const provider = await this.detectProvider(phoneData.phoneNumber);
    
    return {
      phoneNumber: phoneData.phoneNumber,
      type: phoneData.lineType,
      provider,
      location: phoneData.location,
      firstSeen: new Date(),
      lastSeen: new Date(),
      riskScore: phoneData.riskScore,
      metadata: {
        countryCode: phoneData.countryCode,
        carrier: phoneData.carrier,
        isValid: phoneData.isValid,
        isPossibleFraud: phoneData.isPossibleFraud
      }
    };
  }
  
  /**
   * Helper function to determine country code from phone number
   */
  private determineCountryCode(phoneNumber: string): string {
    if (phoneNumber.startsWith('1')) return 'US';
    if (phoneNumber.startsWith('44')) return 'UK';
    if (phoneNumber.startsWith('33')) return 'FR';
    if (phoneNumber.startsWith('49')) return 'DE';
    if (phoneNumber.startsWith('81')) return 'JP';
    if (phoneNumber.startsWith('86')) return 'CN';
    if (phoneNumber.startsWith('91')) return 'IN';
    if (phoneNumber.startsWith('7')) return 'RU';
    if (phoneNumber.startsWith('61')) return 'AU';
    if (phoneNumber.startsWith('55')) return 'BR';
    return 'Unknown';
  }
  
  /**
   * Helper function to determine if a number is likely VoIP
   */
  private isLikelyVoip(phoneNumber: string): boolean {
    // This is a simplified implementation
    // In a real app, this would use a database of known VoIP number ranges
    
    // Some patterns that may indicate VoIP numbers
    if (phoneNumber.includes('8080')) return true;
    if (phoneNumber.endsWith('9999')) return true;
    if (phoneNumber.includes('12345')) return true;
    if (phoneNumber.includes('55555')) return true;
    
    // Random determination for demo purposes
    return phoneNumber.length % 2 === 0;
  }
  
  /**
   * Helper function to determine location from country code
   */
  private determineLocation(countryCode: string): string {
    switch (countryCode) {
      case 'US': return 'United States';
      case 'UK': return 'United Kingdom';
      case 'FR': return 'France';
      case 'DE': return 'Germany';
      case 'JP': return 'Japan';
      case 'CN': return 'China';
      case 'IN': return 'India';
      case 'RU': return 'Russia';
      case 'AU': return 'Australia';
      case 'BR': return 'Brazil';
      default: return 'Unknown';
    }
  }
  
  /**
   * Helper function to determine carrier
   */
  private determineCarrier(isVoip: boolean, phoneNumber: string): string {
    if (!isVoip) {
      // For regular mobile/landline
      if (phoneNumber.endsWith('1111')) return 'AT&T';
      if (phoneNumber.endsWith('2222')) return 'Verizon';
      if (phoneNumber.endsWith('3333')) return 'T-Mobile';
      if (phoneNumber.endsWith('4444')) return 'Vodafone';
      return 'Traditional Carrier';
    } else {
      // For VoIP
      if (phoneNumber.includes('12345')) return 'Twilio';
      if (phoneNumber.includes('55555')) return 'Vonage';
      if (phoneNumber.endsWith('9999')) return 'Skype';
      if (phoneNumber.includes('8080')) return 'RingCentral';
      return 'VoIP Provider';
    }
  }
  
  /**
   * Calculate a risk score for the phone number
   */
  private calculateRiskScore(phoneNumber: string, isVoip: boolean): number {
    let score = 0;
    
    // VoIP numbers generally have higher risk in fraud scenarios
    if (isVoip) score += 30;
    
    // Patterns that might indicate higher risk
    if (phoneNumber.includes('12345')) score += 20;
    if (phoneNumber.includes('11111')) score += 15;
    if (phoneNumber.endsWith('9999')) score += 10;
    
    // Add some randomness for demo purposes
    score += Math.floor(Math.random() * 20);
    
    // Cap at 100
    return Math.min(score, 100);
  }
  
  /**
   * Format a phone number nicely
   */
  private formatPhoneNumber(phoneNumber: string, countryCode: string): string {
    if (countryCode === 'US') {
      if (phoneNumber.length === 10) {
        return `+1 (${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
        return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}-${phoneNumber.substring(7)}`;
      }
    }
    
    // Generic international format
    return `+${phoneNumber}`;
  }
}

export const phoneService = new PhoneService();
