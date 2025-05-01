import { Request, Response } from 'express';
import { whoisService } from '../services/whoisService';
import { z } from 'zod';

const domainSchema = z.object({
  domain: z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i)
});

const portScanSchema = z.object({
  host: z.string(),
  ports: z.array(z.number().min(1).max(65535)).optional()
});

export const whoisController = {
  /**
   * Get WHOIS data for a domain
   */
  async getWhoisData(req: Request, res: Response) {
    try {
      const { domain } = domainSchema.parse(req.body);
      
      const whoisData = await whoisService.getWhoisData(domain);
      
      res.json({
        success: true,
        whoisData
      });
    } catch (error) {
      console.error('Error in getWhoisData:', error);
      res.status(500).json({ error: 'Failed to get WHOIS data' });
    }
  },
  
  /**
   * Scan ports on a host
   */
  async scanPorts(req: Request, res: Response) {
    try {
      const { host, ports } = portScanSchema.parse(req.body);
      
      const scanResults = await whoisService.scanPorts(host, ports);
      
      res.json({
        success: true,
        scanResults,
        count: scanResults.length
      });
    } catch (error) {
      console.error('Error in scanPorts:', error);
      res.status(500).json({ error: 'Failed to scan ports' });
    }
  },
  
  /**
   * Find related domains
   */
  async findRelatedDomains(req: Request, res: Response) {
    try {
      const { domain } = domainSchema.parse(req.body);
      
      const relatedDomains = await whoisService.findRelatedDomains(domain);
      
      res.json({
        success: true,
        relatedDomains,
        count: relatedDomains.length
      });
    } catch (error) {
      console.error('Error in findRelatedDomains:', error);
      res.status(500).json({ error: 'Failed to find related domains' });
    }
  }
};
