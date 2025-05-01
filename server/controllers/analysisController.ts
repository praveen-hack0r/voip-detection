import { Request, Response } from 'express';
import { packetAnalysisService } from '../services/packetAnalysis';
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
      
      const metadata = await packetAnalysisService.extractVoipMetadata(packets);
      
      res.json({
        success: true,
        metadata
      });
    } catch (error) {
      console.error('Error in extractVoipMetadata:', error);
      res.status(500).json({ error: 'Failed to extract VoIP metadata' });
    }
  }
};
