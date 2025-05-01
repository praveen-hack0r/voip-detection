import { Request, Response } from 'express';
import { phoneService } from '../services/phoneService';
import { storage } from '../storage';
import { z } from 'zod';

const phoneNumberSchema = z.object({
  phoneNumber: z.string().min(3).max(20)
});

export const phoneController = {
  /**
   * Lookup phone number
   */
  async lookupPhone(req: Request, res: Response) {
    try {
      const { phoneNumber } = phoneNumberSchema.parse(req.body);
      
      // Check if we already have metadata for this number
      let metadata = await storage.getNumberMetadataByNumber(phoneNumber);
      
      if (metadata) {
        // Update last seen timestamp
        metadata = await storage.updateNumberMetadata(phoneNumber, {
          lastSeen: new Date()
        });
        
        return res.json({
          success: true,
          metadata,
          source: 'cache'
        });
      }
      
      // Get new metadata
      const phoneData = await phoneService.lookupPhoneNumber(phoneNumber);
      const formattedData = await phoneService.formatForStorage(phoneData);
      
      // Store metadata
      metadata = await storage.createNumberMetadata(formattedData);
      
      res.json({
        success: true,
        metadata,
        source: 'api'
      });
    } catch (error) {
      console.error('Error in lookupPhone:', error);
      res.status(500).json({ error: 'Failed to lookup phone number' });
    }
  },
  
  /**
   * Get all phone metadata
   */
  async getAllPhoneMetadata(req: Request, res: Response) {
    try {
      const metadata = await storage.getNumberMetadata();
      
      res.json({
        success: true,
        metadata,
        count: metadata.length
      });
    } catch (error) {
      console.error('Error in getAllPhoneMetadata:', error);
      res.status(500).json({ error: 'Failed to retrieve phone metadata' });
    }
  },
  
  /**
   * Create VoIP trace
   */
  async createTrace(req: Request, res: Response) {
    try {
      const traceSchema = z.object({
        phoneNumber: z.string().min(3).max(20),
        type: z.string(),
        originLocation: z.string(),
        destinationLocation: z.string(),
        duration: z.number(),
        serviceProvider: z.string().optional(),
        riskScore: z.number().optional()
      });
      
      const traceData = traceSchema.parse(req.body);
      
      // Store trace
      const trace = await storage.createVoipTrace(traceData);
      
      res.json({
        success: true,
        trace
      });
    } catch (error) {
      console.error('Error in createTrace:', error);
      res.status(500).json({ error: 'Failed to create VoIP trace' });
    }
  },
  
  /**
   * Get VoIP traces
   */
  async getTraces(req: Request, res: Response) {
    try {
      const traces = await storage.getVoipTraces();
      
      res.json({
        success: true,
        traces,
        count: traces.length
      });
    } catch (error) {
      console.error('Error in getTraces:', error);
      res.status(500).json({ error: 'Failed to retrieve VoIP traces' });
    }
  }
};
