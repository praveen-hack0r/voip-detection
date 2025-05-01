export interface VoipTrace {
  id: number;
  phoneNumber: string;
  type: string;
  originLocation: string;
  destinationLocation: string;
  timestamp: string;
  duration: number;
  serviceProvider?: string;
  riskScore?: number;
}

export interface PacketData {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  info: string;
  rawData?: any;
}

export interface NumberMetadata {
  id: number;
  phoneNumber: string;
  type: string;
  provider?: string;
  location?: string;
  firstSeen: string;
  lastSeen: string;
  riskScore?: number;
  metadata?: any;
}

export interface ApiService {
  id: number;
  name: string;
  status: string;
  quotaRemaining?: number;
  lastUpdated: string;
}

export interface GeoLocation {
  ip: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    country: string;
    countryCode: string;
  };
  isp: string;
  asn: number;
  asOrganization: string;
  timezone: string;
  isProxy: boolean;
}

export interface PortScanResult {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'filtered';
  version?: string;
}

export interface WhoisData {
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

export interface DashboardStats {
  activeVoipSessions: number;
  analyzedNumbers: number;
  suspiciousActivity: number;
  uniqueGeolocations: number;
}
