import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface WhoisData {
  domainName: string;
  registrar: string;
  registrantName?: string;
  registrantOrganization?: string;
  registrantCountry?: string;
  nameServers: string[];
  creationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  registryDomainId?: string;
  status: string[];
  domainAvailability: 'registered' | 'available';
  contactEmail?: string;
  contactPhone?: string;
  relatedDomains?: string[];
}

interface PortScanResult {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'filtered';
  version?: string;
}

export class WhoisService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.WHOIS_API_KEY || 'demo_key';
  }
  
  /**
   * Get WHOIS information for a domain
   */
  async getWhoisData(domain: string): Promise<WhoisData> {
    try {
      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }
      
      // In a real implementation, this would be an actual API call:
      // const response = await axios.get(`https://api.whoisxmlapi.com/v1?apiKey=${this.apiKey}&domainName=${domain}`);
      
      // For demo purposes, generate a plausible response
      return this.generateWhoisData(domain);
    } catch (error) {
      console.error('Error in WHOIS lookup:', error);
      throw new Error('Failed to get WHOIS information');
    }
  }
  
  /**
   * Get open ports for a host
   */
  async scanPorts(host: string, ports: number[] = [80, 443, 21, 22, 25, 53, 3306, 5432, 5060, 5061]): Promise<PortScanResult[]> {
    try {
      if (!this.isValidHostname(host)) {
        throw new Error('Invalid hostname format');
      }
      
      // For security reasons, we would typically use a restricted set of ports
      // and not allow arbitrary port scanning
      const sanitizedPorts = ports.filter(port => port > 0 && port < 65536);
      const sanitizedHost = host.replace(/[;&|"'$\\]/g, '');
      
      // In a real implementation, this would run a secure port scanner
      // However, for security and ethical reasons, actual port scanning code is not implemented here
      
      // For demo purposes, generate plausible results
      return this.generatePortScanResults(sanitizedHost, sanitizedPorts);
    } catch (error) {
      console.error('Error scanning ports:', error);
      throw new Error('Failed to scan ports');
    }
  }
  
  /**
   * Find related domains based on a domain
   */
  async findRelatedDomains(domain: string): Promise<string[]> {
    try {
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }
      
      // Extract the domain without TLD
      const domainParts = domain.split('.');
      const baseDomain = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domain;
      
      // In a real implementation, this would use a domain suggestion API or similar
      // For demo purposes, generate some plausible related domains
      const tlds = ['.com', '.net', '.org', '.io', '.app', '.co'];
      const prefixes = ['my', 'the', 'get', 'go', 'try', 'best', 'pro', 'secure'];
      const suffixes = ['app', 'site', 'hub', 'center', 'service', 'cloud', 'online'];
      
      const related = [];
      
      // Generate variations with different TLDs
      for (const tld of tlds) {
        if (!domain.endsWith(tld)) {
          related.push(baseDomain + tld);
        }
      }
      
      // Generate variations with prefixes
      for (const prefix of prefixes) {
        related.push(prefix + baseDomain + '.com');
      }
      
      // Generate variations with suffixes
      for (const suffix of suffixes) {
        related.push(baseDomain + suffix + '.com');
      }
      
      // Return a subset to avoid too many results
      return related.slice(0, 10);
    } catch (error) {
      console.error('Error finding related domains:', error);
      throw new Error('Failed to find related domains');
    }
  }
  
  /**
   * Validate if a string is a valid domain
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }
  
  /**
   * Validate if a string is a valid hostname or IP
   */
  private isValidHostname(host: string): boolean {
    // Check if it's a valid domain
    if (this.isValidDomain(host)) {
      return true;
    }
    
    // Check if it's a valid IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(host);
  }
  
  /**
   * Generate plausible WHOIS data for a domain
   */
  private generateWhoisData(domain: string): WhoisData {
    const tld = domain.split('.').pop() || 'com';
    const isWellKnown = domain.includes('google') || domain.includes('amazon') || domain.includes('microsoft');
    
    // Get a date from 1-10 years ago
    const getRandomPastDate = (yearsAgo: number) => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - yearsAgo - Math.random());
      return date.toISOString().split('T')[0];
    };
    
    // Get a date 1-10 years in the future
    const getRandomFutureDate = () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1 + Math.floor(Math.random() * 9));
      return date.toISOString().split('T')[0];
    };
    
    const creationDate = getRandomPastDate(isWellKnown ? 10 : 5);
    const updatedDate = getRandomPastDate(1);
    const expirationDate = getRandomFutureDate();
    
    return {
      domainName: domain,
      registrar: isWellKnown ? 'MarkMonitor Inc.' : ['GoDaddy.com LLC', 'Namecheap Inc.', 'NameSilo LLC', 'Amazon Registrar Inc.', 'Google Domains'][Math.floor(Math.random() * 5)],
      registrantName: isWellKnown ? undefined : ['John Doe', 'Jane Smith', 'Private Registration', 'Domain Admin'][Math.floor(Math.random() * 4)],
      registrantOrganization: isWellKnown ? this.capitalize(domain.split('.')[0]) + ' Inc.' : undefined,
      registrantCountry: isWellKnown ? 'US' : ['US', 'GB', 'DE', 'CA', 'AU', 'FR'][Math.floor(Math.random() * 6)],
      nameServers: isWellKnown 
        ? [`ns1.${domain}`, `ns2.${domain}`]
        : [`ns1.${['godaddy', 'namecheap', 'cloudflare', 'digitalocean', 'aws'][Math.floor(Math.random() * 5)]}.com`, `ns2.${['godaddy', 'namecheap', 'cloudflare', 'digitalocean', 'aws'][Math.floor(Math.random() * 5)]}.com`],
      creationDate,
      expirationDate,
      updatedDate,
      registryDomainId: 'D' + Math.floor(Math.random() * 10000000),
      status: ['clientTransferProhibited', 'clientUpdateProhibited', 'clientDeleteProhibited'],
      domainAvailability: 'registered',
      contactEmail: isWellKnown ? undefined : `admin@${domain}`,
      contactPhone: isWellKnown ? undefined : `+1.${Math.floor(Math.random() * 1000)}${Math.floor(Math.random() * 1000)}${Math.floor(Math.random() * 10000)}`,
      relatedDomains: [
        domain.replace(`.${tld}`, `.com`),
        domain.replace(`.${tld}`, `.net`),
        domain.replace(`.${tld}`, `.org`)
      ].filter(d => d !== domain)
    };
  }
  
  /**
   * Generate plausible port scan results
   */
  private generatePortScanResults(host: string, ports: number[]): PortScanResult[] {
    const commonServices: Record<number, string> = {
      21: 'FTP',
      22: 'SSH',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      3306: 'MySQL',
      5060: 'SIP',
      5061: 'SIP over TLS',
      5432: 'PostgreSQL',
      8080: 'HTTP Proxy',
      8443: 'HTTPS Alt'
    };
    
    return ports.map(port => {
      const isOpen = Math.random() > 0.6; // 40% chance port is open
      
      return {
        port,
        service: commonServices[port] || 'Unknown',
        state: isOpen ? 'open' : (Math.random() > 0.5 ? 'closed' : 'filtered'),
        ...(isOpen && {
          version: this.generateServiceVersion(port)
        })
      };
    });
  }
  
  /**
   * Generate plausible service version string
   */
  private generateServiceVersion(port: number): string {
    switch (port) {
      case 22: return `OpenSSH ${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`;
      case 80:
      case 443: return `Apache/${Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 30)}` + (Math.random() > 0.5 ? ` PHP/${Math.floor(Math.random() * 2) + 7}.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 30)}` : '');
      case 21: return `Pure-FTPd`;
      case 25: return `Postfix ${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 12)}`;
      case 3306: return `MySQL ${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 30)}`;
      case 5432: return `PostgreSQL ${Math.floor(Math.random() * 5) + 9}.${Math.floor(Math.random() * 6)}`;
      case 5060:
      case 5061: return `Asterisk PBX ${Math.floor(Math.random() * 5) + 13}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 5)}`;
      default: return '';
    }
  }
  
  /**
   * Capitalize a string
   */
  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export const whoisService = new WhoisService();
