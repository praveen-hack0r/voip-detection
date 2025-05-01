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

export interface CallState {
  setup: boolean;
  connected: boolean;
  mediaEstablished: boolean;
  terminated: boolean;
}

export interface RtpDetails {
  payloadType: number;
  firstSeqNum: number;
  lastSeqNum: number;
  packetCount: number;
  mediaSize: number;
}

export interface CallSession {
  callId: string;
  methods: string[];
  endpoints: string[];
  packets: number;
  sipPackets: number;
  rtpPackets: number;
  duration: number;
  codec: string;
  callState: CallState;
  rtpDetails?: RtpDetails | null;
  callDuration?: number;
}

export interface PortInfo {
  port: number;
  count: number;
  services: string[];
}

export interface DomainInfo {
  domain: string;
  whoisData?: WhoisData;
  relatedDomains?: string[];
  error?: string;
}

export interface VoipMetadata {
  sipPacketCount: number;
  rtpPacketCount: number;
  totalPackets: number;
  endpoints: string[];
  ips: string[];
  domains: string[];
  ports: PortInfo[];
  voipEndpoints: string[];
  calls: CallSession[];
  activeCallCount: number;
  completedCallCount: number;
  userAgents: string[];
  methodDistribution: Record<string, number>;
  codecs: string[];
  rtpStats: {
    totalPackets: number;
    totalMediaSize: number;
    codecs: string[];
  };
  ipGeolocations?: {
    geolocations: GeoLocation[];
  };
  domainInfo?: DomainInfo[];
  portInfo?: PortInfo[];
  phoneNumbers?: NumberMetadata[];
  storedPhoneMetadata?: NumberMetadata[];
}
