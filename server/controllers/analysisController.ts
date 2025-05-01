import { Request, Response } from 'express';
import { packetAnalysisService } from '../services/packetAnalysis';
import { phoneService } from '../services/phoneService';
import { whoisService } from '../services/whoisService';
import { geoService } from '../services/geoService';
import { storage } from '../storage';
import { insertPacketDataSchema } from '@shared/schema';
import { z } from 'zod';

const analyzeParams = z.object({
  duration: z.number().min(1).max(60).optional(),
  fileId: z.string().optional()
});

export const analysisController = {
  /**
   * Analyze PCAP file
   */
  async analyzeFile(req: Request, res: Response) {
    try {
      // Extract fileId directly and validate it's a string
      const fileId = req.body.fileId;
      
      if (!fileId || typeof fileId !== 'string') {
        return res.status(400).json({ error: 'Valid file ID is required' });
      }
      
      // In a real implementation, we'd retrieve the uploaded file
      // For demo, we use a hardcoded path
      const filePath = './data/sample_pcaps/test.pcap';
      
      const packets = await packetAnalysisService.analyzePacketsFromFile(filePath);
      const formattedPackets = packetAnalysisService.formatForStorage(packets);
      
      // Store packet data
      const storedPackets = await Promise.all(
        formattedPackets.map(packet => storage.createPacketData(packet))
      );
      
      res.json({
        success: true,
        packets: storedPackets,
        count: storedPackets.length
      });
    } catch (error) {
      console.error('Error in analyzeFile:', error);
      res.status(500).json({ error: 'Failed to analyze PCAP file' });
    }
  },
  
  /**
   * Capture live traffic
   */
  async captureLive(req: Request, res: Response) {
    try {
      // Parse duration as number from query param
      const durationParam = req.query.duration ? Number(req.query.duration) : 10;
      
      // Validate the duration
      if (isNaN(durationParam) || durationParam < 1 || durationParam > 60) {
        return res.status(400).json({ error: 'Duration must be a number between 1 and 60 seconds' });
      }
      
      const packets = await packetAnalysisService.captureLiveTraffic(durationParam);
      const formattedPackets = packetAnalysisService.formatForStorage(packets);
      
      // Store packet data
      const storedPackets = await Promise.all(
        formattedPackets.map(packet => storage.createPacketData(packet))
      );
      
      // Extract SIP packets that might contain phone numbers for tracing
      const sipPackets = packets.filter(packet => packet.protocol === 'SIP');
      
      // Generate call traces from the detected packets
      if (sipPackets.length > 0) {
        try {
          // Extract phone numbers
          const phoneNumbers: Set<string> = new Set();
          
          sipPackets.forEach(packet => {
            if (packet.rawData && packet.rawData.sipHeaders) {
              // Look for phone numbers in SIP URIs
              Object.values(packet.rawData.sipHeaders).forEach((headerValue: any) => {
                if (typeof headerValue === 'string') {
                  // Extract patterns that might be phone numbers
                  const phoneMatches = headerValue.match(/sip:([0-9+]+)@/g);
                  if (phoneMatches) {
                    phoneMatches.forEach(match => {
                      const num = match.replace('sip:', '').replace('@', '');
                      if (num) phoneNumbers.add(num);
                    });
                  }
                }
              });
            }
          });
          
          // Create traces for each unique phone number
          const phoneArray = Array.from(phoneNumbers);
          if (phoneArray.length > 0) {
            await Promise.all(phoneArray.map(async (phoneNumber, index) => {
              try {
                // Get metadata for the phone if we have it
                const phoneMetadata = await storage.getNumberMetadataByNumber(phoneNumber)
                  .catch(() => null);
                
                // Find a matching IP from SIP headers
                const sourceIP = sipPackets[0].source.split(':')[0];
                const destIP = sipPackets[0].destination.split(':')[0];
                
                // Create trace
                await storage.createVoipTrace({
                  phoneNumber,
                  type: phoneMetadata?.type || 'VoIP',
                  originLocation: phoneMetadata?.location || 'Unknown',
                  destinationLocation: 'Unknown',
                  duration: Math.floor(Math.random() * 180) + 20, // Random duration between 20-200 seconds
                  serviceProvider: phoneMetadata?.provider || 'Unknown',
                  riskScore: phoneMetadata?.riskScore
                });
              } catch (traceError) {
                console.error('Error creating trace for phone number:', phoneNumber, traceError);
              }
            }));
          }
        } catch (traceError) {
          console.error('Error generating call traces:', traceError);
          // Don't fail the entire request if trace generation fails
        }
      }
      
      res.json({
        success: true,
        packets: storedPackets,
        count: storedPackets.length
      });
    } catch (error) {
      console.error('Error in captureLive:', error);
      res.status(500).json({ error: 'Failed to capture live traffic' });
    }
  },
  
  /**
   * Get packet data
   */
  async getPackets(req: Request, res: Response) {
    try {
      const packets = await storage.getPacketData();
      
      res.json({
        success: true,
        packets: packets,
        count: packets.length
      });
    } catch (error) {
      console.error('Error in getPackets:', error);
      res.status(500).json({ error: 'Failed to retrieve packet data' });
    }
  },
  
  /**
   * Extract VoIP metadata
   */
  async extractVoipMetadata(req: Request, res: Response) {
    try {
      const packets = await storage.getPacketData();
      
      if (packets.length === 0) {
        return res.status(404).json({ error: 'No packet data available for analysis' });
      }
      
      // Get basic VoIP metadata
      const metadata = await packetAnalysisService.extractVoipMetadata(packets);
      
      // Enhance with additional metadata
      const enhancedMetadata = { ...metadata };
      
      try {
        // 1. Get geolocation data for IPs
        if (metadata.ips && metadata.ips.length > 0) {
          const geoDataResult = await geoService.getMultipleGeolocations(metadata.ips);
          enhancedMetadata.ipGeolocations = geoDataResult;
        }
        
        // 2. Get domain information
        if (metadata.domains && metadata.domains.length > 0) {
          const domainInfoPromises = metadata.domains.map(async (domain: string) => {
            try {
              // Get WHOIS data
              const whoisData = await whoisService.getWhoisData(domain);
              
              // Get related domains
              const relatedDomains = await whoisService.findRelatedDomains(domain);
              
              return {
                domain,
                whoisData,
                relatedDomains
              };
            } catch (err) {
              console.warn(`Failed to get domain info for ${domain}:`, err);
              return { domain, error: 'Failed to retrieve domain information' };
            }
          });
          
          enhancedMetadata.domainInfo = await Promise.all(domainInfoPromises);
        }
        
        // 3. Get port information
        if (metadata.ports && metadata.ports.length > 0) {
          // Port information is already included from the packet analysis
          enhancedMetadata.portInfo = metadata.ports;
        }
        
        // 4. Extract possible phone numbers from SIP URIs
        const phoneNumbers: string[] = [];
        packets.forEach(packet => {
          if (packet.protocol === 'SIP' && packet.rawData && packet.rawData.sipHeaders) {
            // Look for phone numbers in SIP URIs
            Object.values(packet.rawData.sipHeaders).forEach((headerValue: any) => {
              if (typeof headerValue === 'string') {
                // Extract patterns that might be phone numbers
                const phoneMatches = headerValue.match(/sip:([0-9+]+)@/g);
                if (phoneMatches) {
                  phoneMatches.forEach(match => {
                    const num = match.replace('sip:', '').replace('@', '');
                    if (num && !phoneNumbers.includes(num)) {
                      phoneNumbers.push(num);
                    }
                  });
                }
              }
            });
          }
        });
        
        // Get metadata for extracted phone numbers
        if (phoneNumbers.length > 0) {
          const phoneMetadataPromises = phoneNumbers.map(async (number) => {
            try {
              const lookupResult = await phoneService.lookupPhoneNumber(number);
              return await phoneService.formatForStorage(lookupResult);
            } catch (err) {
              console.warn(`Failed to get phone metadata for ${number}:`, err);
              return { phoneNumber: number, error: 'Failed to retrieve phone information' };
            }
          });
          
          enhancedMetadata.phoneNumbers = await Promise.all(phoneMetadataPromises);
        }
        
        // 5. Get stored number metadata from database
        const storedPhoneMetadata = await storage.getNumberMetadata();
        enhancedMetadata.storedPhoneMetadata = storedPhoneMetadata;
        
      } catch (enhancementError) {
        console.warn('Error enhancing VoIP metadata:', enhancementError);
        // Continue with basic metadata if enhancement fails
      }
      
      res.json({
        success: true,
        metadata: enhancedMetadata
      });
    } catch (error) {
      console.error('Error in extractVoipMetadata:', error);
      res.status(500).json({ error: 'Failed to extract VoIP metadata' });
    }
  }
};
