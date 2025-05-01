import { apiRequest } from './queryClient';
import {
  VoipTrace,
  PacketData,
  NumberMetadata,
  ApiService,
  GeoLocation,
  PortScanResult,
  WhoisData
} from './types';

// Packet Analysis API
export const analyzePacketFile = async (fileId: string) => {
  const res = await apiRequest('POST', '/api/analysis/pcap', { fileId });
  return res.json();
};

export const captureLiveTraffic = async (duration: number = 10) => {
  const res = await apiRequest('GET', `/api/analysis/live?duration=${duration}`);
  return res.json();
};

export const getPackets = async (): Promise<{ success: boolean; packets: PacketData[]; count: number }> => {
  const res = await apiRequest('GET', '/api/analysis/packets');
  return res.json();
};

export const getVoipMetadata = async () => {
  const res = await apiRequest('GET', '/api/analysis/voip-metadata');
  return res.json();
};

// Phone Lookup API
export const lookupPhoneNumber = async (phoneNumber: string): Promise<{ success: boolean; metadata: NumberMetadata; source: string }> => {
  const res = await apiRequest('POST', '/api/phone/lookup', { phoneNumber });
  return res.json();
};

export const getAllPhoneMetadata = async (): Promise<{ success: boolean; metadata: NumberMetadata[]; count: number }> => {
  const res = await apiRequest('GET', '/api/phone/metadata');
  return res.json();
};

export const createVoipTrace = async (traceData: Omit<VoipTrace, 'id' | 'timestamp'>): Promise<{ success: boolean; trace: VoipTrace }> => {
  const res = await apiRequest('POST', '/api/phone/trace', traceData);
  return res.json();
};

export const getVoipTraces = async (): Promise<{ success: boolean; traces: VoipTrace[]; count: number }> => {
  const res = await apiRequest('GET', '/api/phone/traces');
  return res.json();
};

// Geolocation API
export const getIpGeolocation = async (ip: string): Promise<{ success: boolean; geolocation: GeoLocation }> => {
  const res = await apiRequest('POST', '/api/geo/ip', { ip });
  return res.json();
};

export const getMultipleGeolocations = async (ips: string[]): Promise<{ success: boolean; geolocations: GeoLocation[]; count: number }> => {
  const res = await apiRequest('POST', '/api/geo/multiple', { ips });
  return res.json();
};

export const traceRoute = async (sourceIp: string, destinationIp: string): Promise<{ success: boolean; route: GeoLocation[]; count: number }> => {
  const res = await apiRequest('POST', '/api/geo/trace', { sourceIp, destinationIp });
  return res.json();
};

// WHOIS and Domain API
export const getWhoisData = async (domain: string): Promise<{ success: boolean; whoisData: WhoisData }> => {
  const res = await apiRequest('POST', '/api/whois/domain', { domain });
  return res.json();
};

export const scanPorts = async (host: string, ports?: number[]): Promise<{ success: boolean; scanResults: PortScanResult[]; count: number }> => {
  const res = await apiRequest('POST', '/api/whois/ports', { host, ports });
  return res.json();
};

export const findRelatedDomains = async (domain: string): Promise<{ success: boolean; relatedDomains: string[]; count: number }> => {
  const res = await apiRequest('POST', '/api/whois/related', { domain });
  return res.json();
};

// API Services
export const getApiServices = async (): Promise<{ success: boolean; services: ApiService[] }> => {
  const res = await apiRequest('GET', '/api/services/status');
  return res.json();
};
