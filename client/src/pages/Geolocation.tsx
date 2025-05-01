import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getIpGeolocation,
  getMultipleGeolocations,
  traceRoute
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MapVisualization from '@/components/MapVisualization';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Route, 
  RefreshCw
} from 'lucide-react';
import { GeoLocation } from '@/lib/types';

const Geolocation: React.FC = () => {
  const { toast } = useToast();
  const [ip, setIp] = useState('');
  const [sourceIp, setSourceIp] = useState('');
  const [destinationIp, setDestinationIp] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [routeData, setRouteData] = useState<GeoLocation[]>([]);
  
  // Mutation for IP geolocation
  const geoMutation = useMutation({
    mutationFn: (ip: string) => getIpGeolocation(ip),
    onSuccess: (data) => {
      setSelectedLocation(data.geolocation);
      toast({
        title: "Geolocation Complete",
        description: `Found location for ${data.geolocation.ip}`
      });
    },
    onError: (error) => {
      toast({
        title: "Geolocation Error",
        description: `Failed to geolocate IP: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for route tracing
  const routeMutation = useMutation({
    mutationFn: (params: { sourceIp: string; destinationIp: string }) => 
      traceRoute(params.sourceIp, params.destinationIp),
    onSuccess: (data) => {
      setRouteData(data.route);
      toast({
        title: "Route Trace Complete",
        description: `Traced route with ${data.count} hops`
      });
    },
    onError: (error) => {
      toast({
        title: "Route Tracing Error",
        description: `Failed to trace route: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Sample IP locations for the map
  const { data: sampleLocations } = useQuery({
    queryKey: ['/api/geo/multiple/sample'],
    queryFn: async () => {
      const sampleIps = [
        '192.168.1.45', '203.0.113.10', '198.51.100.22', 
        '172.16.254.1', '8.8.8.8', '45.60.75.90'
      ];
      return await getMultipleGeolocations(sampleIps);
    }
  });
  
  const handleGeolocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an IP address",
        variant: "destructive"
      });
      return;
    }
    
    geoMutation.mutate(ip);
  };
  
  const handleTraceRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceIp.trim() || !destinationIp.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both source and destination IP addresses",
        variant: "destructive"
      });
      return;
    }
    
    routeMutation.mutate({ sourceIp, destinationIp });
  };
  
  // Prepare data for the visualization
  const mapLocations = [
    ...(selectedLocation ? [selectedLocation] : []),
    ...(sampleLocations?.geolocations || [])
  ];
  
  // Prepare route data for visualization
  const routes = routeData.length > 1 ? [
    { source: routeData[0], destination: routeData[routeData.length - 1] }
  ] : [];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Geolocation</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track IP locations and visualize call routes
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => {
              setSelectedLocation(null);
              setRouteData([]);
              setIp('');
              setSourceIp('');
              setDestinationIp('');
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Map
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <MapVisualization
            geolocations={mapLocations}
            routes={routes}
            isLoading={geoMutation.isPending || routeMutation.isPending}
            footerText={`Showing ${mapLocations.length} locations${routeData.length ? ` and ${routeData.length} route hops` : ''}`}
          />
        </div>
        
        <div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>IP Geolocation</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGeolocate} className="space-y-4">
                  <div>
                    <Label htmlFor="ip">IP Address</Label>
                    <Input
                      id="ip"
                      type="text"
                      placeholder="8.8.8.8"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      disabled={geoMutation.isPending}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={geoMutation.isPending || !ip.trim()}
                    className="w-full"
                  >
                    {geoMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Locating...</span>
                      </div>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Geolocate IP
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trace Route</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTraceRoute} className="space-y-4">
                  <div>
                    <Label htmlFor="sourceIp">Source IP</Label>
                    <Input
                      id="sourceIp"
                      type="text"
                      placeholder="192.168.1.1"
                      value={sourceIp}
                      onChange={(e) => setSourceIp(e.target.value)}
                      disabled={routeMutation.isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="destinationIp">Destination IP</Label>
                    <Input
                      id="destinationIp"
                      type="text"
                      placeholder="8.8.8.8"
                      value={destinationIp}
                      onChange={(e) => setDestinationIp(e.target.value)}
                      disabled={routeMutation.isPending}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={routeMutation.isPending || !sourceIp.trim() || !destinationIp.trim()}
                    className="w-full"
                  >
                    {routeMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Tracing...</span>
                      </div>
                    ) : (
                      <>
                        <Route className="mr-2 h-4 w-4" />
                        Trace Route
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">IP Address:</span>
                      <span className="font-medium">{selectedLocation.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="font-medium">{selectedLocation.location.city}, {selectedLocation.location.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Coordinates:</span>
                      <span className="font-medium">{selectedLocation.location.latitude.toFixed(4)}, {selectedLocation.location.longitude.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ISP:</span>
                      <span className="font-medium">{selectedLocation.isp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Organization:</span>
                      <span className="font-medium">{selectedLocation.asOrganization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Proxy/VPN:</span>
                      <span className={`font-medium ${selectedLocation.isProxy ? 'text-red-500' : 'text-green-500'}`}>
                        {selectedLocation.isProxy ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {routeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Hops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hop
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ISP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proxy
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {routeData.map((hop, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {hop.ip}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {hop.location.city}, {hop.location.country}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {hop.isp}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hop.isProxy ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                          {hop.isProxy ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Geolocation;
