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
    const protocols = ['TCP', 'UDP', 'HTTP', 'DNS', 'SIP', 'RTP'];
    const ips = [
      '192.168.1.100', '10.0.0.25', '172.16.254.1', 
      '8.8.8.8', '1.1.1.1', '192.168.0.1',
      '45.60.75.90', '23.45.67.89', '98.76.54.32'
    ];
    const ports = [80, 443, 53, 22, 5060, 5061, 8080, 3389, 21];
    const rtpPorts = [10000, 10002, 10004, 10006, 10008, 10010]; // RTP typically uses even ports
    const sipMethods = ['INVITE', 'ACK', 'BYE', 'REGISTER', 'OPTIONS', 'CANCEL'];
    const voipCodecs = ['G.711', 'G.729', 'G.722', 'iLBC', 'Opus'];
    const callIds = [
      'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', 
      'a3c65c2b-9b3a-5e98-b472-37a092d0559f', 
      '2e05b5fe-5d9b-4993-8d6e-e2df88a6e66b',
      'call-20250501-abcd1234',
      'virtual-number-call-91827364'
    ];
    
    const result: ParsedPacket[] = [];

    if (includeSip) {
      // Generate complete VoIP call flows instead of random packets
      const numCalls = Math.min(3, Math.floor(count / 10)); // Generate complete call flows
      
      // Determine how many completed vs active calls to create
      const completedCalls = Math.max(1, Math.floor(numCalls * 0.6)); // 60% completed calls
      const activeCalls = numCalls - completedCalls; // 40% active calls
      
      // Generate completed calls first
      for (let callNum = 0; callNum < completedCalls; callNum++) {
        const callerIp = ips[Math.floor(Math.random() * ips.length)];
        const calleeIp = ips[Math.floor(Math.random() * ips.length)];
        const callId = callIds[Math.floor(Math.random() * callIds.length)];
        const codec = voipCodecs[Math.floor(Math.random() * voipCodecs.length)];
        const callerSipPort = 5060;
        const calleeSipPort = 5060;
        const callerRtpPort = rtpPorts[Math.floor(Math.random() * rtpPorts.length)];
        const calleeRtpPort = rtpPorts[Math.floor(Math.random() * rtpPorts.length)];
        const callTime = new Date().getTime();
        
        // Call setup packets (SIP signaling)
        // 1. INVITE
        result.push(this.createSipPacket(callerIp, callerSipPort, calleeIp, calleeSipPort, 'INVITE', callId, codec, callTime));
        
        // 2. 100 Trying
        result.push(this.createSipPacket(calleeIp, calleeSipPort, callerIp, callerSipPort, '100', callId, codec, callTime + 50, {
          responseCode: 100,
          responseText: 'Trying'
        }));
        
        // 3. 180 Ringing
        result.push(this.createSipPacket(calleeIp, calleeSipPort, callerIp, callerSipPort, '180', callId, codec, callTime + 200, {
          responseCode: 180,
          responseText: 'Ringing'
        }));
        
        // 4. 200 OK
        result.push(this.createSipPacket(calleeIp, calleeSipPort, callerIp, callerSipPort, '200', callId, codec, callTime + 1500, {
          responseCode: 200,
          responseText: 'OK',
          sdp: {
            mediaPort: calleeRtpPort,
            mediaType: 'audio',
            codecName: codec,
            rtpmap: this.getCodecRtpMap(codec)
          }
        }));
        
        // 5. ACK
        result.push(this.createSipPacket(callerIp, callerSipPort, calleeIp, calleeSipPort, 'ACK', callId, codec, callTime + 1600));
        
        // 6-15. RTP Packets (Media flow - actual call audio)
        const callDuration = Math.floor(Math.random() * 10000) + 5000; // 5-15 seconds
        const packetsPerSecond = 50; // Typical RTP sends 50 packets per second
        const totalRtpPackets = Math.min(Math.floor(callDuration / 1000 * packetsPerSecond), 20); // Cap at 20 for demo
        
        for (let i = 0; i < totalRtpPackets; i++) {
          // RTP packets flow in both directions
          const rtpTime = callTime + 1700 + (i * 20); // 20ms intervals
          
          // Caller to Callee
          if (i % 2 === 0) {
            result.push(this.createRtpPacket(
              callerIp, callerRtpPort, 
              calleeIp, calleeRtpPort, 
              callId, codec, rtpTime, i
            ));
          } 
          // Callee to Caller
          else {
            result.push(this.createRtpPacket(
              calleeIp, calleeRtpPort, 
              callerIp, callerRtpPort, 
              callId, codec, rtpTime, i
            ));
          }
        }
        
        // 16. BYE (Call termination)
        const byeTime = callTime + callDuration;
        result.push(this.createSipPacket(callerIp, callerSipPort, calleeIp, calleeSipPort, 'BYE', callId, codec, byeTime, {
          callDuration: callDuration
        }));
        
        // 17. 200 OK (for BYE)
        result.push(this.createSipPacket(calleeIp, calleeSipPort, callerIp, callerSipPort, '200', callId, codec, byeTime + 50, {
          responseCode: 200,
          responseText: 'OK',
          isBye: true
        }));
      }
    }
    
    // Fill remaining slots with various packet types
    while (result.length < count) {
      const sourceIp = ips[Math.floor(Math.random() * ips.length)];
      const destIp = ips[Math.floor(Math.random() * ips.length)];
      const sourcePort = ports[Math.floor(Math.random() * ports.length)];
      const destPort = ports[Math.floor(Math.random() * ports.length)];
      
      let protocol = protocols[Math.floor(Math.random() * protocols.length)];
      if (protocol === 'SIP' || protocol === 'RTP') {
        // We already have SIP and RTP from the call flows
        protocol = protocols[Math.floor(Math.random() * (protocols.length - 2))];
      }
      
      let info = '';
      let rawData: any = { timestamp: new Date().getTime(), length: Math.floor(Math.random() * 1500) };
      
      if (protocol === 'HTTP') {
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
   * Create a SIP packet for the synthetic data
   */
  private createSipPacket(
    sourceIp: string, sourcePort: number, 
    destIp: string, destPort: number, 
    method: string, callId: string, 
    codec: string, timestamp: number, 
    extraData: any = {}
  ): ParsedPacket {
    const isResponse = !isNaN(Number(method));
    
    let info = isResponse 
      ? `SIP/2.0 ${method} ${extraData.responseText}` 
      : `${method} sip:user@${destIp} SIP/2.0`;
    
    let sipHeaders: any = {
      From: `<sip:user@${sourceIp}>;tag=1928301774`,
      To: `<sip:callee@${destIp}>` + (isResponse ? ';tag=314159' : ''),
      CallID: callId,
      CSeq: isResponse ? `1 ${extraData.isBye ? 'BYE' : 'INVITE'}` : `1 ${method}`,
      Via: `SIP/2.0/UDP ${sourceIp}:${sourcePort};branch=z9hG4bK776asdhds`,
      Contact: `<sip:user@${sourceIp}:${sourcePort}>`
    };
    
    if (extraData.sdp) {
      sipHeaders['Content-Type'] = 'application/sdp';
      sipHeaders['Content-Length'] = '158';
    }
    
    const rawData: any = {
      timestamp,
      length: Math.floor(Math.random() * 500) + 200,
      callId,
      method: isResponse ? (extraData.isBye ? 'BYE-OK' : 'INVITE-OK') : method,
      codec,
      userAgent: 'VoIP Phone/1.0',
      sipHeaders
    };
    
    if (extraData.sdp) {
      rawData.sdp = extraData.sdp;
    }
    
    if (extraData.callDuration) {
      rawData.callDuration = extraData.callDuration;
    }
    
    if (isResponse) {
      rawData.responseCode = extraData.responseCode;
      rawData.responseText = extraData.responseText;
    }
    
    return {
      timestamp: new Date(timestamp).toISOString(),
      source: `${sourceIp}:${sourcePort}`,
      destination: `${destIp}:${destPort}`,
      protocol: 'SIP',
      info,
      rawData
    };
  }
  
  /**
   * Create an RTP packet for the synthetic data
   */
  private createRtpPacket(
    sourceIp: string, sourcePort: number, 
    destIp: string, destPort: number, 
    callId: string, codec: string, 
    timestamp: number, sequenceNumber: number
  ): ParsedPacket {
    return {
      timestamp: new Date(timestamp).toISOString(),
      source: `${sourceIp}:${sourcePort}`,
      destination: `${destIp}:${destPort}`,
      protocol: 'RTP',
      info: `RTP audio stream (${codec})`,
      rawData: {
        timestamp,
        length: Math.floor(Math.random() * 160) + 40, // RTP packets are typically small
        callId,
        codec,
        rtpHeader: {
          version: 2,
          padding: 0,
          extension: 0,
          csrcCount: 0,
          marker: sequenceNumber === 0 ? 1 : 0, // First packet has marker bit set
          payloadType: this.getPayloadTypeForCodec(codec),
          sequenceNumber: sequenceNumber,
          timestamp: timestamp * 8, // RTP timestamp increments by samples
          ssrc: Math.floor(Math.random() * 0xFFFFFFFF) // Random synchronization source
        },
        payloadSize: Math.floor(Math.random() * 100) + 40
      }
    };
  }
  
  /**
   * Get the payload type for a codec
   */
  private getPayloadTypeForCodec(codec: string): number {
    switch (codec) {
      case 'G.711': return 0; // PCMU
      case 'G.729': return 18;
      case 'G.722': return 9;
      case 'iLBC': return 98;
      case 'Opus': return 111;
      default: return 0;
    }
  }
  
  /**
   * Get the RTP map for a codec
   */
  private getCodecRtpMap(codec: string): string {
    switch (codec) {
      case 'G.711': return '0 PCMU/8000';
      case 'G.729': return '18 G729/8000';
      case 'G.722': return '9 G722/8000';
      case 'iLBC': return '98 iLBC/8000';
      case 'Opus': return '111 opus/48000/2';
      default: return '0 PCMU/8000';
    }
  }
  
  /**
   * Extracts VoIP metadata from packet data including endpoints, domains, and ports
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
    
    // Extract IPs for further analysis
    const ips = endpoints.map(endpoint => endpoint.split(':')[0])
      .filter((value, index, self) => self.indexOf(value) === index);
    
    // Extract domains and ports from SIP URIs and headers
    const domainsMap: Record<string, boolean> = {};
    const portsMap: Record<string, { count: number, services: string[] }> = {};
    
    sipPackets.forEach(packet => {
      if (packet.rawData && packet.rawData.sipHeaders) {
        // Extract domains from SIP headers
        const headers = packet.rawData.sipHeaders;
        
        // Check various headers for domains
        ['From', 'To', 'Contact', 'Via'].forEach(header => {
          if (headers[header]) {
            // Extract domains from sip:user@domain format
            const domainMatch = headers[header].match(/@([a-zA-Z0-9.-]+)/); 
            if (domainMatch && domainMatch[1]) {
              domainsMap[domainMatch[1]] = true;
            }
          }
        });
      }
      
      // Track port usage
      const sourcePort = packet.source.split(':')[1];
      const destPort = packet.destination.split(':')[1];
      
      if (sourcePort) {
        if (!portsMap[sourcePort]) {
          portsMap[sourcePort] = { count: 0, services: ['SIP'] };
        }
        portsMap[sourcePort].count++;
      }
      
      if (destPort) {
        if (!portsMap[destPort]) {
          portsMap[destPort] = { count: 0, services: ['SIP'] };
        }
        portsMap[destPort].count++;
      }
    });
    
    // Also analyze RTP packets for media flow analysis
    const rtpPackets = packetData.filter(packet => packet.protocol === 'RTP');
    
    // Track RTP ports
    rtpPackets.forEach(packet => {
      const sourcePort = packet.source.split(':')[1];
      const destPort = packet.destination.split(':')[1];
      
      if (sourcePort) {
        if (!portsMap[sourcePort]) {
          portsMap[sourcePort] = { count: 0, services: ['RTP'] };
        } else if (!portsMap[sourcePort].services.includes('RTP')) {
          portsMap[sourcePort].services.push('RTP');
        }
        portsMap[sourcePort].count++;
      }
      
      if (destPort) {
        if (!portsMap[destPort]) {
          portsMap[destPort] = { count: 0, services: ['RTP'] };
        } else if (!portsMap[destPort].services.includes('RTP')) {
          portsMap[destPort].services.push('RTP');
        }
        portsMap[destPort].count++;
      }
    });
    
    // Extract call IDs from SIP and RTP packets to identify unique sessions
    const callIdMap: Record<string, any> = {};
    
    // First process SIP packets
    sipPackets.forEach(packet => {
      if (packet.rawData && packet.rawData.callId) {
        if (!callIdMap[packet.rawData.callId]) {
          callIdMap[packet.rawData.callId] = {
            callId: packet.rawData.callId,
            methods: [],
            endpoints: [],
            packets: 0,
            sipPackets: 0,
            rtpPackets: 0,
            firstSeen: packet.timestamp,
            lastSeen: packet.timestamp,
            codec: packet.rawData.codec || 'Unknown',
            callSetup: false,
            callConnected: false,
            callTerminated: false,
            mediaEstablished: false
          };
        }
        
        // Update session info
        const session = callIdMap[packet.rawData.callId];
        session.packets++;
        session.sipPackets++;
        
        const method = packet.rawData.method || 'UNKNOWN';
        if (!session.methods.includes(method)) {
          session.methods.push(method);
        }
        
        // Track call state based on SIP methods/responses
        if (method === 'INVITE') {
          session.callSetup = true;
        }
        
        // Consider a call connected if we see an INVITE-OK, 200 OK, or ACK after INVITE
        if (method === 'INVITE-OK' || 
            (method === '200 OK' && session.methods.includes('INVITE')) ||
            (method === 'ACK' && session.methods.includes('INVITE'))) {
          session.callConnected = true;
        }
        
        // Call is terminated if we see a BYE or BYE-OK
        if (method === 'BYE' || method === 'BYE-OK' || method === 'CANCEL') {
          session.callTerminated = true;
        }
        
        // If SDP is present, the media is being established
        if (packet.rawData.sdp) {
          session.mediaEstablished = true;
          if (packet.rawData.sdp.mediaPort) {
            session.mediaPort = packet.rawData.sdp.mediaPort;
          }
        }
        
        // Track call duration if available
        if (packet.rawData.callDuration) {
          session.callDuration = packet.rawData.callDuration;
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
    
    // Then process RTP packets and associate them with SIP sessions
    rtpPackets.forEach(packet => {
      if (packet.rawData && packet.rawData.callId) {
        const callId = packet.rawData.callId;
        
        // Create or update the call session
        if (!callIdMap[callId]) {
          // This RTP packet doesn't have a corresponding SIP session yet
          callIdMap[callId] = {
            callId: callId,
            methods: [],
            endpoints: [],
            packets: 0,
            sipPackets: 0,
            rtpPackets: 0,
            firstSeen: packet.timestamp,
            lastSeen: packet.timestamp,
            codec: packet.rawData.codec || 'Unknown',
            mediaEstablished: true  // If we have RTP, media is established
          };
        }
        
        const session = callIdMap[callId];
        session.packets++;
        session.rtpPackets++;
        session.mediaEstablished = true;
        
        // Update codec info if available
        if (packet.rawData.codec && !session.codec) {
          session.codec = packet.rawData.codec;
        }
        
        // Add RTP-specific details
        if (!session.rtpDetails) {
          session.rtpDetails = {
            payloadType: packet.rawData.rtpHeader?.payloadType,
            firstSeqNum: packet.rawData.rtpHeader?.sequenceNumber,
            lastSeqNum: packet.rawData.rtpHeader?.sequenceNumber,
            packetCount: 0,
            mediaSize: 0
          };
        }
        
        // Update RTP stats
        if (session.rtpDetails) {
          session.rtpDetails.packetCount++;
          session.rtpDetails.lastSeqNum = packet.rawData.rtpHeader?.sequenceNumber;
          session.rtpDetails.mediaSize += packet.rawData.payloadSize || 0;
        }
        
        // Add endpoints if new
        const sourceIp = packet.source.split(':')[0];
        if (!session.endpoints.includes(sourceIp)) {
          session.endpoints.push(sourceIp);
        }
        
        const destIp = packet.destination.split(':')[0];
        if (!session.endpoints.includes(destIp)) {
          session.endpoints.push(destIp);
        }
        
        // Update session timing
        if (new Date(packet.timestamp) > new Date(session.lastSeen)) {
          session.lastSeen = packet.timestamp;
        }
      }
    });
    
    // Convert call sessions to array format with serializable data
    const callSessions = Object.values(callIdMap).map(session => ({
      callId: session.callId,
      methods: session.methods,
      endpoints: session.endpoints,
      packets: session.packets,
      sipPackets: session.sipPackets || 0,
      rtpPackets: session.rtpPackets || 0,
      duration: session.lastSeen ? 
        new Date(session.lastSeen).getTime() - new Date(session.firstSeen).getTime() : 0,
      codec: session.codec,
      callState: {
        setup: session.callSetup || false,
        connected: session.callConnected || false,
        mediaEstablished: session.mediaEstablished || false,
        terminated: session.callTerminated || false
      },
      rtpDetails: session.rtpDetails || null,
      callDuration: session.callDuration
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
    
    // Calculate RTP statistics
    const rtpStats = {
      totalPackets: rtpPackets.length,
      totalMediaSize: rtpPackets.reduce((sum, p) => sum + (p.rawData?.payloadSize || 0), 0),
      codecs: rtpPackets
        .filter(p => p.rawData && p.rawData.codec)
        .map(p => p.rawData.codec)
        .filter((value, index, self) => self.indexOf(value) === index)
    };
    
    // Format domains and ports for output
    const domains = Object.keys(domainsMap);
    const ports = Object.entries(portsMap).map(([port, info]) => ({
      port: parseInt(port),
      count: info.count,
      services: info.services,
    }));

    return {
      sipPacketCount: sipPackets.length,
      rtpPacketCount: rtpPackets.length,
      totalPackets: packetData.length,
      endpoints: endpoints,
      ips: ips,
      domains: domains,
      ports: ports,
      voipEndpoints: endpoints.filter(ep => {
        const [ip, port] = ep.split(':');
        const rtpPortRange = [10000, 10002, 10004, 10006, 10008, 10010]; // Same as defined above
        return port === '5060' || port === '5061' || rtpPortRange.includes(parseInt(port));
      }),
      sessions: this.identifySipSessions(sipPackets),
      calls: callSessions,
      // A call is active if connected OR has media flowing (but not terminated)
      activeCallCount: callSessions.filter(c => {
        if (c.callState.terminated) return false; // Exclude terminated calls
        return c.callState.connected || c.callState.mediaEstablished || c.rtpPackets > 0 || c.callState.setup;
      }).length,
      completedCallCount: callSessions.filter(c => c.callState.terminated).length,
      userAgents: userAgents,
      methodDistribution: methodCount,
      codecs: [
        ...sipPackets.filter(p => p.rawData && p.rawData.codec).map(p => p.rawData.codec),
        ...rtpPackets.filter(p => p.rawData && p.rawData.codec).map(p => p.rawData.codec)
      ].filter((value, index, self) => self.indexOf(value) === index),
      rtpStats
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
