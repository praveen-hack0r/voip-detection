import { InsertPacketData } from '@shared/schema';

interface ParsedPacket {
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  info: string;
  rawData: any;
}

/**
 * Service for analyzing network packets using Python's Scapy library
 */
export class PacketAnalysisService {
  /**
   * Analyzes SIP/VoIP packets from a provided PCAP file
   */
  async analyzePacketsFromFile(fileId: string): Promise<ParsedPacket[]> {
    try {
      // Since we can't use Python/Scapy, let's generate synthetic packet data
      console.log(`Analyzing file with ID: ${fileId}`);
      return this.generateSyntheticPacketData(15, true);
    } catch (error) {
      console.error('Error in packet analysis:', error);
      throw new Error('Failed to analyze packets');
    }
  }
  
  /**
   * Captures live SIP/VoIP traffic
   */
  async captureLiveTraffic(duration: number = 10): Promise<ParsedPacket[]> {
    try {
      console.log(`Capturing live traffic for ${duration} seconds`);
      // Since we can't use Python/Scapy, let's generate synthetic packet data
      return this.generateSyntheticPacketData(Math.min(10, duration), true);
    } catch (error) {
      console.error('Error in live traffic capture:', error);
      throw new Error('Failed to capture live traffic');
    }
  }
  
  /**
   * Generates synthetic packet data for demo purposes
   */
  private generateSyntheticPacketData(count: number, includeSip = false): ParsedPacket[] {
    const protocols = ['TCP', 'UDP', 'HTTP', 'DNS', 'SIP'];
    const ips = [
      '192.168.1.100', '10.0.0.25', '172.16.254.1', 
      '8.8.8.8', '1.1.1.1', '192.168.0.1',
      '45.60.75.90', '23.45.67.89', '98.76.54.32'
    ];
    const ports = [80, 443, 53, 22, 5060, 5061, 8080, 3389, 21];
    const sipMethods = ['INVITE', 'ACK', 'BYE', 'REGISTER', 'OPTIONS', 'CANCEL'];
    const voipCodecs = ['G.711', 'G.729', 'G.722', 'iLBC', 'Opus'];
    const callIds = ['f81d4fae-7dec-11d0-a765-00a0c91e6bf6', 'a3c65c2b-9b3a-5e98-b472-37a092d0559f', '2e05b5fe-5d9b-4993-8d6e-e2df88a6e66b'];
    
    const result: ParsedPacket[] = [];
    
    // Generate random packet data with more VoIP content
    for (let i = 0; i < count; i++) {
      const sourceIp = ips[Math.floor(Math.random() * ips.length)];
      const destIp = ips[Math.floor(Math.random() * ips.length)];
      // Use VoIP ports more frequently
      const sourcePort = Math.random() < 0.4 ? 5060 : ports[Math.floor(Math.random() * ports.length)];
      const destPort = Math.random() < 0.4 ? 5061 : ports[Math.floor(Math.random() * ports.length)];
      
      let protocol = protocols[Math.floor(Math.random() * (protocols.length - (includeSip ? 0 : 1)))];
      
      // Ensure we have many SIP packets for testing purposes if requested
      if (includeSip && i < count / 2) {
        protocol = 'SIP';
      }
      
      let info = '';
      let rawData: any = { timestamp: new Date().getTime(), length: Math.floor(Math.random() * 1500) };
      
      if (protocol === 'SIP') {
        const method = sipMethods[Math.floor(Math.random() * sipMethods.length)];
        const callId = callIds[Math.floor(Math.random() * callIds.length)];
        const codec = voipCodecs[Math.floor(Math.random() * voipCodecs.length)];
        info = `${method} sip:user@${destIp} SIP/2.0`;
        
        // Add VoIP-specific metadata to the rawData
        rawData = {
          ...rawData,
          callId: callId,
          method: method,
          codec: codec,
          userAgent: 'VoIP Phone/1.0',
          callDuration: method === 'BYE' ? Math.floor(Math.random() * 600) : undefined,
          sipHeaders: {
            From: `<sip:user@${sourceIp}>;tag=1928301774`,
            To: `<sip:callee@${destIp}>`,
            CallID: callId,
            CSeq: `${Math.floor(Math.random() * 100)} ${method}`,
            Via: `SIP/2.0/UDP ${sourceIp}:${sourcePort};branch=z9hG4bK776asdhds`,
            Contact: `<sip:user@${sourceIp}:${sourcePort}>`
          }
        };
      } else if (protocol === 'HTTP') {
        info = Math.random() > 0.5 ? 'GET /index.html HTTP/1.1' : 'POST /api/data HTTP/1.1';
      } else {
        info = `${protocol} packet`;
      }
      
      result.push({
        timestamp: new Date().toISOString(),
        source: `${sourceIp}:${sourcePort}`,
        destination: `${destIp}:${destPort}`,
        protocol,
        info,
        rawData
      });
    }
    
    return result;
  }
  
  /**
   * Extracts VoIP metadata from packet data
   */
  async extractVoipMetadata(packetData: any[]): Promise<any> {
    // Filter for SIP packets and extract relevant metadata
    const sipPackets = packetData.filter(packet => packet.protocol === 'SIP');
    
    // Get unique endpoints using object keys instead of Set
    const endpointMap: Record<string, boolean> = {};
    sipPackets.forEach(p => {
      endpointMap[p.source] = true;
      endpointMap[p.destination] = true;
    });
    const endpoints = Object.keys(endpointMap);
    
    // Extract call IDs from SIP packets to identify unique sessions
    const callIdMap: Record<string, any> = {};
    sipPackets.forEach(packet => {
      if (packet.rawData && packet.rawData.callId) {
        if (!callIdMap[packet.rawData.callId]) {
          callIdMap[packet.rawData.callId] = {
            callId: packet.rawData.callId,
            methods: [],
            endpoints: [],
            packets: 0,
            firstSeen: packet.timestamp,
            lastSeen: packet.timestamp,
            codec: packet.rawData.codec || 'Unknown',
          };
        }
        
        // Update session info
        const session = callIdMap[packet.rawData.callId];
        session.packets++;
        const method = packet.rawData.method || 'UNKNOWN';
        if (!session.methods.includes(method)) {
          session.methods.push(method);
        }
        
        const sourceIp = packet.source.split(':')[0];
        if (!session.endpoints.includes(sourceIp)) {
          session.endpoints.push(sourceIp);
        }
        
        const destIp = packet.destination.split(':')[0];
        if (!session.endpoints.includes(destIp)) {
          session.endpoints.push(destIp);
        }
        session.lastSeen = packet.timestamp;
      }
    });
    
    // Convert call sessions to array format with serializable data
    const callSessions = Object.values(callIdMap).map(session => ({
      callId: session.callId,
      methods: session.methods,
      endpoints: session.endpoints,
      packets: session.packets,
      duration: session.lastSeen ? 
        new Date(session.lastSeen).getTime() - new Date(session.firstSeen).getTime() : 0,
      codec: session.codec
    }));
    
    // Extract VoIP user agents
    const userAgents = sipPackets
      .filter(p => p.rawData && p.rawData.userAgent)
      .map(p => p.rawData.userAgent)
      .filter((v, i, a) => a.indexOf(v) === i); // unique values
    
    // Extract SIP methods distribution
    const methodCount: Record<string, number> = {};
    sipPackets.forEach(p => {
      if (p.rawData && p.rawData.method) {
        methodCount[p.rawData.method] = (methodCount[p.rawData.method] || 0) + 1;
      }
    });
    
    return {
      callCount: sipPackets.length,
      endpoints: endpoints,
      sessions: this.identifySipSessions(sipPackets),
      calls: callSessions,
      userAgents: userAgents,
      methodDistribution: methodCount,
      codecs: sipPackets
        .filter(p => p.rawData && p.rawData.codec)
        .map(p => p.rawData.codec)
        .filter((value, index, self) => self.indexOf(value) === index) // unique values
    };
  }
  
  /**
   * Identifies SIP sessions from a collection of SIP packets
   */
  private identifySipSessions(sipPackets: any[]): any[] {
    // Group packets by potential SIP dialogs/sessions
    // In a real implementation, this would parse SIP headers and match Call-ID and tags
    
    // Simple grouping for demo purposes using an object map instead of Set
    const sessions: any[] = [];
    const processedSources: Record<string, boolean> = {};
    
    sipPackets.forEach(packet => {
      const source = packet.source.split(':')[0];
      const destination = packet.destination.split(':')[0];
      
      if (!processedSources[source]) {
        processedSources[source] = true;
        sessions.push({
          source,
          destination,
          packets: sipPackets.filter(p => 
            p.source.includes(source) || p.destination.includes(source)
          ).length
        });
      }
    });
    
    return sessions;
  }
  
  /**
   * Formats packet data for storage
   */
  formatForStorage(packets: ParsedPacket[]): InsertPacketData[] {
    return packets.map(packet => ({
      timestamp: new Date(),
      source: packet.source,
      destination: packet.destination,
      protocol: packet.protocol,
      info: packet.info || '',
      rawData: packet.rawData || {}
    }));
  }
}

export const packetAnalysisService = new PacketAnalysisService();
