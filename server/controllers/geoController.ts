import { Request, Response } from 'express';
import { geoService } from '../services/geoService';
import { z } from 'zod';

const ipSchema = z.object({
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
});

const multipleIpsSchema = z.object({
  ips: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/))
});

const traceRouteSchema = z.object({
  sourceIp: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/),
  destinationIp: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
});

export const geoController = {
  /**
   * Get geolocation for an IP
   */
  async getIpGeolocation(req: Request, res: Response) {
    try {
      const { ip } = ipSchema.parse(req.body);
      
      const geolocation = await geoService.getIpGeolocation(ip);
      
      res.json({
        success: true,
        geolocation
      });
    } catch (error) {
      console.error('Error in getIpGeolocation:', error);
      res.status(500).json({ error: 'Failed to get IP geolocation' });
    }
  },
  
  /**
   * Get geolocation for multiple IPs
   */
  async getMultipleGeolocations(req: Request, res: Response) {
    try {
      const { ips } = multipleIpsSchema.parse(req.body);
      
      const geolocations = await geoService.getMultipleGeolocations(ips);
      
      res.json({
        success: true,
        geolocations,
        count: geolocations.length
      });
    } catch (error) {
      console.error('Error in getMultipleGeolocations:', error);
      res.status(500).json({ error: 'Failed to get multiple IP geolocations' });
    }
  },
  
  /**
   * Trace route between two IPs
   */
  async traceRoute(req: Request, res: Response) {
    try {
      const { sourceIp, destinationIp } = traceRouteSchema.parse(req.body);
      
      const route = await geoService.traceRoute(sourceIp, destinationIp);
      
      res.json({
        success: true,
        route,
        count: route.length
      });
    } catch (error) {
      console.error('Error in traceRoute:', error);
      res.status(500).json({ error: 'Failed to trace route' });
    }
  }
};
