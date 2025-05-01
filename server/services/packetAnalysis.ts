import { exec } from 'child_process';
import { promisify } from 'util';
import { InsertPacketData } from '@shared/schema';

const execAsync = promisify(exec);

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
  async analyzePacketsFromFile(filePath: string): Promise<ParsedPacket[]> {
    try {
      // This would execute a Python script that uses Scapy to parse the PCAP file
      // For security reasons, we'd validate the file path and use proper input sanitization
      const sanitizedPath = filePath.replace(/[;&|"'$\\]/g, '');
      
      // Command to execute Scapy script to parse PCAP
      const command = `python3 -c "
from scapy.all import rdpcap, IP, UDP
from scapy.layers.inet import TCP
import json
import sys

try:
    packets = rdpcap('${sanitizedPath}')
    results = []
    
    for i, pkt in enumerate(packets):
        if i >= 100:  # Limit to first 100 packets for performance
            break
            
        packet_data = {
            'timestamp': '',
            'source': '',
            'destination': '',
            'protocol': '',
            'info': '',
            'rawData': {}
        }
        
        # Extract timestamp if available
        if 'time' in pkt:
            packet_data['timestamp'] = pkt.time
        
        # Extract IP information
        if IP in pkt:
            packet_data['source'] = pkt[IP].src
            packet_data['destination'] = pkt[IP].dst
            
            # Detect protocol
            if TCP in pkt:
                packet_data['protocol'] = 'TCP'
                packet_data['source'] += ':' + str(pkt[TCP].sport)
                packet_data['destination'] += ':' + str(pkt[TCP].dport)
                
                # SIP detection (port 5060)
                if pkt[TCP].sport == 5060 or pkt[TCP].dport == 5060:
                    packet_data['protocol'] = 'SIP'
                    if hasattr(pkt, 'load'):
                        packet_data['info'] = pkt.load[:50].decode('utf-8', errors='ignore')
            
            elif UDP in pkt:
                packet_data['protocol'] = 'UDP'
                packet_data['source'] += ':' + str(pkt[UDP].sport)
                packet_data['destination'] += ':' + str(pkt[UDP].dport)
                
                # SIP detection (port 5060)
                if pkt[UDP].sport == 5060 or pkt[UDP].dport == 5060:
                    packet_data['protocol'] = 'SIP'
                    if hasattr(pkt, 'load'):
                        packet_data['info'] = pkt.load[:50].decode('utf-8', errors='ignore')
        
        results.append(packet_data)
    
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;

      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error('Error analyzing PCAP file:', stderr);
        throw new Error('Failed to analyze PCAP file');
      }
      
      // Parse the JSON output from the Python script
      const parsedOutput = JSON.parse(stdout);
      
      if (parsedOutput.error) {
        throw new Error(`Python script error: ${parsedOutput.error}`);
      }
      
      return parsedOutput;
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
      // Command to execute Scapy to capture live traffic for a specified duration
      const command = `python3 -c "
from scapy.all import sniff, IP, UDP
from scapy.layers.inet import TCP
import json
import sys
import time

results = []

def packet_callback(pkt):
    if IP in pkt:
        packet_data = {
            'timestamp': time.time(),
            'source': '',
            'destination': '',
            'protocol': '',
            'info': '',
            'rawData': {}
        }
        
        packet_data['source'] = pkt[IP].src
        packet_data['destination'] = pkt[IP].dst
        
        if TCP in pkt:
            packet_data['protocol'] = 'TCP'
            packet_data['source'] += ':' + str(pkt[TCP].sport)
            packet_data['destination'] += ':' + str(pkt[TCP].dport)
            
            # SIP detection
            if pkt[TCP].sport == 5060 or pkt[TCP].dport == 5060:
                packet_data['protocol'] = 'SIP'
                if hasattr(pkt, 'load'):
                    packet_data['info'] = pkt.load[:50].decode('utf-8', errors='ignore')
        
        elif UDP in pkt:
            packet_data['protocol'] = 'UDP'
            packet_data['source'] += ':' + str(pkt[UDP].sport)
            packet_data['destination'] += ':' + str(pkt[UDP].dport)
            
            # SIP detection
            if pkt[UDP].sport == 5060 or pkt[UDP].dport == 5060:
                packet_data['protocol'] = 'SIP'
                if hasattr(pkt, 'load'):
                    packet_data['info'] = pkt.load[:50].decode('utf-8', errors='ignore')
        
        results.append(packet_data)

try:
    # Sniff packets for the specified duration (filter for SIP traffic on port 5060)
    sniff(filter='port 5060', prn=packet_callback, store=0, timeout=${duration})
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`;

      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error('Error capturing live traffic:', stderr);
        throw new Error('Failed to capture live traffic');
      }
      
      // Parse the JSON output from the Python script
      const parsedOutput = JSON.parse(stdout);
      
      if (parsedOutput.error) {
        throw new Error(`Python script error: ${parsedOutput.error}`);
      }
      
      return parsedOutput;
    } catch (error) {
      console.error('Error in live traffic capture:', error);
      throw new Error('Failed to capture live traffic');
    }
  }
  
  /**
   * Extracts VoIP metadata from packet data
   */
  async extractVoipMetadata(packetData: ParsedPacket[]): Promise<any> {
    // Filter for SIP packets and extract relevant metadata
    const sipPackets = packetData.filter(packet => packet.protocol === 'SIP');
    
    // This would typically involve deep packet inspection and protocol analysis
    // For the MVP, we return a simplified version
    return {
      callCount: sipPackets.length,
      endpoints: [...new Set([...sipPackets.map(p => p.source), ...sipPackets.map(p => p.destination)])],
      sessions: this.identifySipSessions(sipPackets)
    };
  }
  
  /**
   * Identifies SIP sessions from a collection of SIP packets
   */
  private identifySipSessions(sipPackets: ParsedPacket[]): any[] {
    // Group packets by potential SIP dialogs/sessions
    // In a real implementation, this would parse SIP headers and match Call-ID and tags
    
    // Simple grouping for demo purposes
    const sessions: any[] = [];
    const processedSources = new Set<string>();
    
    sipPackets.forEach(packet => {
      const source = packet.source.split(':')[0];
      const destination = packet.destination.split(':')[0];
      
      if (!processedSources.has(source)) {
        processedSources.add(source);
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
