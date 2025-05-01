import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analysisController } from "./controllers/analysisController";
import { phoneController } from "./controllers/phoneController";
import { geoController } from "./controllers/geoController";
import { whoisController } from "./controllers/whoisController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up API routes
  // Packet analysis routes
  app.post('/api/analysis/pcap', analysisController.analyzeFile);
  app.get('/api/analysis/live', analysisController.captureLive);
  app.get('/api/analysis/packets', analysisController.getPackets);
  app.post('/api/analysis/clear', analysisController.clearAllData);
  app.get('/api/analysis/voip-metadata', analysisController.extractVoipMetadata);
  
  // Phone lookup routes
  app.post('/api/phone/lookup', phoneController.lookupPhone);
  app.get('/api/phone/metadata', phoneController.getAllPhoneMetadata);
  app.post('/api/phone/trace', phoneController.createTrace);
  app.get('/api/phone/traces', phoneController.getTraces);
  
  // Geolocation routes
  app.post('/api/geo/ip', geoController.getIpGeolocation);
  app.post('/api/geo/multiple', geoController.getMultipleGeolocations);
  app.post('/api/geo/trace', geoController.traceRoute);
  
  // WHOIS and domain routes
  app.post('/api/whois/domain', whoisController.getWhoisData);
  app.post('/api/whois/ports', whoisController.scanPorts);
  app.post('/api/whois/related', whoisController.findRelatedDomains);
  
  // API service status
  app.get('/api/services/status', async (_req, res) => {
    try {
      const services = await storage.getApiServices();
      res.json({ success: true, services });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get service status' });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
