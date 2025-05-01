import axios from 'axios';

interface GeoLocation {
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

export class GeoService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GEO_API_KEY || 'demo_key';
  }
  
  /**
   * Get geolocation information for an IP address
   */
  async getIpGeolocation(ip: string): Promise<GeoLocation> {
    try {
      // Validate IP format
      if (!this.isValidIp(ip)) {
        throw new Error('Invalid IP address format');
      }
      
      // In a real implementation, this would be an actual API call:
      // const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${this.apiKey}&ip=${ip}`);
      
      // For demo purposes, generate a plausible response based on IP patterns
      return this.generateGeoLocation(ip);
    } catch (error) {
      console.error('Error in IP geolocation:', error);
      throw new Error('Failed to get IP geolocation information');
    }
  }
  
  /**
   * Get multiple geolocations for a list of IPs
   */
  async getMultipleGeolocations(ips: string[]): Promise<GeoLocation[]> {
    // Validate and deduplicate IPs
    const validIps = [...new Set(ips)].filter(ip => this.isValidIp(ip));
    
    // Process each IP
    const results = await Promise.all(
      validIps.map(ip => this.getIpGeolocation(ip))
    );
    
    return results;
  }
  
  /**
   * Trace the route between two IP addresses
   */
  async traceRoute(sourceIp: string, destinationIp: string): Promise<GeoLocation[]> {
    try {
      if (!this.isValidIp(sourceIp) || !this.isValidIp(destinationIp)) {
        throw new Error('Invalid IP address format');
      }
      
      // In a real implementation, we'd use API or traceroute to get actual path
      // For demo purposes, generate a plausible path
      const sourceGeo = await this.getIpGeolocation(sourceIp);
      const destGeo = await this.getIpGeolocation(destinationIp);
      
      // Generate intermediate hops
      const hops = this.generateIntermediateHops(sourceGeo, destGeo);
      
      return [sourceGeo, ...hops, destGeo];
    } catch (error) {
      console.error('Error tracing route:', error);
      throw new Error('Failed to trace route between IP addresses');
    }
  }
  
  /**
   * Validate if a string is a valid IP address
   */
  private isValidIp(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }
  
  /**
   * Generate plausible geolocation data for an IP
   */
  private generateGeoLocation(ip: string): GeoLocation {
    // Different ranges for different regions (simplified)
    const ipParts = ip.split('.').map(Number);
    
    let country, countryCode, region, city, lat, lng;
    
    // Very simple classification based on first octet
    // This is only for demo purposes and not accurate for real IP allocation
    if (ipParts[0] < 50) {
      country = 'United States';
      countryCode = 'US';
      region = 'California';
      city = 'San Francisco';
      lat = 37.7749 + (Math.random() * 0.1 - 0.05);
      lng = -122.4194 + (Math.random() * 0.1 - 0.05);
    } else if (ipParts[0] < 100) {
      country = 'United Kingdom';
      countryCode = 'GB';
      region = 'England';
      city = 'London';
      lat = 51.5074 + (Math.random() * 0.1 - 0.05);
      lng = -0.1278 + (Math.random() * 0.1 - 0.05);
    } else if (ipParts[0] < 150) {
      country = 'Germany';
      countryCode = 'DE';
      region = 'Berlin';
      city = 'Berlin';
      lat = 52.5200 + (Math.random() * 0.1 - 0.05);
      lng = 13.4050 + (Math.random() * 0.1 - 0.05);
    } else if (ipParts[0] < 200) {
      country = 'Japan';
      countryCode = 'JP';
      region = 'Tokyo';
      city = 'Tokyo';
      lat = 35.6762 + (Math.random() * 0.1 - 0.05);
      lng = 139.6503 + (Math.random() * 0.1 - 0.05);
    } else {
      country = 'Australia';
      countryCode = 'AU';
      region = 'New South Wales';
      city = 'Sydney';
      lat = -33.8688 + (Math.random() * 0.1 - 0.05);
      lng = 151.2093 + (Math.random() * 0.1 - 0.05);
    }
    
    const isProxy = ipParts[3] > 200; // Arbitrary logic for demo
    
    return {
      ip,
      location: {
        latitude: lat,
        longitude: lng,
        city,
        region,
        country,
        countryCode
      },
      isp: this.generateIsp(ipParts),
      asn: 12345 + ipParts[1] * 100,
      asOrganization: this.generateIsp(ipParts),
      timezone: 'UTC',
      isProxy
    };
  }
  
  /**
   * Generate a plausible ISP name based on IP
   */
  private generateIsp(ipParts: number[]): string {
    const isps = [
      'Cloudflare',
      'Google',
      'Amazon AWS',
      'Microsoft Azure',
      'Digital Ocean',
      'Comcast',
      'Verizon',
      'AT&T',
      'T-Mobile',
      'Orange',
      'Deutsche Telekom',
      'NTT Communications'
    ];
    
    return isps[ipParts[1] % isps.length];
  }
  
  /**
   * Generate intermediate hops between source and destination
   */
  private generateIntermediateHops(source: GeoLocation, dest: GeoLocation): GeoLocation[] {
    const hops: GeoLocation[] = [];
    const hopCount = 1 + Math.floor(Math.random() * 3); // 1-3 hops
    
    for (let i = 0; i < hopCount; i++) {
      // Calculate position along the path
      const ratio = (i + 1) / (hopCount + 1);
      
      // Simple linear interpolation between source and destination
      const lat = source.location.latitude + ratio * (dest.location.latitude - source.location.latitude);
      const lng = source.location.longitude + ratio * (dest.location.longitude - source.location.longitude);
      
      // Generate hop IP
      const ipParts = source.ip.split('.').map(Number);
      ipParts[2] = Math.floor(Math.random() * 255);
      ipParts[3] = Math.floor(Math.random() * 255);
      const hopIp = ipParts.join('.');
      
      // Find nearest city to the coordinates (simplified)
      const hopGeo = this.generateGeoLocation(hopIp);
      
      // Override with interpolated coordinates
      hopGeo.location.latitude = lat;
      hopGeo.location.longitude = lng;
      
      hops.push(hopGeo);
    }
    
    return hops;
  }
}

export const geoService = new GeoService();
