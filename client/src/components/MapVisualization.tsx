import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeoLocation } from '@/lib/types';

// We'll use Leaflet for the map visualization
interface MapVisualizationProps {
  geolocations: GeoLocation[];
  routes?: { source: GeoLocation; destination: GeoLocation }[];
  isLoading?: boolean;
  onLiveViewClick?: () => void;
  footerText?: string;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  geolocations,
  routes = [],
  isLoading = false,
  onLiveViewClick,
  footerText
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      // Load Leaflet CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);
      
      // Wait for a moment to ensure CSS is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load Leaflet JS
      const L = await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js');
      
      // Initialize map if it doesn't exist
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2);
        
        // Add tile layer (map visual)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }
      
      const map = mapInstanceRef.current;
      
      // Clear existing markers and lines
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });
      
      // Add markers for each geolocation
      geolocations.forEach(geo => {
        if (geo.location.latitude && geo.location.longitude) {
          const marker = L.marker([geo.location.latitude, geo.location.longitude])
            .addTo(map)
            .bindPopup(`
              <b>${geo.ip}</b><br>
              ${geo.location.city}, ${geo.location.country}<br>
              ISP: ${geo.isp}
            `);
        }
      });
      
      // Add lines for routes
      routes.forEach(route => {
        if (
          route.source.location.latitude && 
          route.source.location.longitude && 
          route.destination.location.latitude && 
          route.destination.location.longitude
        ) {
          const line = L.polyline([
            [route.source.location.latitude, route.source.location.longitude],
            [route.destination.location.latitude, route.destination.location.longitude]
          ], { color: 'red', weight: 2, opacity: 0.7 }).addTo(map);
        }
      });
    };
    
    loadLeaflet();
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geolocations, routes]);
  
  return (
    <Card className="overflow-hidden shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            VoIP Traffic Geolocation
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Last 24h
            </Button>
            <Button size="sm" onClick={onLiveViewClick}>
              Live View
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-80 bg-gray-50 dark:bg-gray-900 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : geolocations.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No geolocation data available</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-full w-full"></div>
          )}
        </div>
      </CardContent>
      
      {footerText && (
        <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {footerText}
        </CardFooter>
      )}
    </Card>
  );
};

export default MapVisualization;
