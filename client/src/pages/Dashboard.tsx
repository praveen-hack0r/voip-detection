import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Wifi, 
  Phone as PhoneIcon, 
  AlertTriangle, 
  Globe 
} from 'lucide-react';
import StatusCard from '@/components/StatusCard';
import MapVisualization from '@/components/MapVisualization';
import CallTraceList from '@/components/CallTraceList';
import PacketAnalysisTable from '@/components/PacketAnalysisTable';
import NumberDetails from '@/components/NumberDetails';
import ApiStatusCards from '@/components/ApiStatusCards';
import { 
  getApiServices, 
  getVoipTraces, 
  getPackets,
  getAllPhoneMetadata,
  getMultipleGeolocations
} from '@/lib/api';
import { NumberMetadata } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [selectedNumber, setSelectedNumber] = useState<NumberMetadata | undefined>();
  
  // Fetch API services status
  const { 
    data: servicesData,
    isLoading: isServicesLoading,
    refetch: refetchServices
  } = useQuery({
    queryKey: ['/api/services/status'],
    queryFn: getApiServices
  });

  // Fetch VoIP traces
  const { 
    data: tracesData,
    isLoading: isTracesLoading
  } = useQuery({
    queryKey: ['/api/phone/traces'],
    queryFn: getVoipTraces
  });

  // Fetch packet data
  const { 
    data: packetsData,
    isLoading: isPacketsLoading
  } = useQuery({
    queryKey: ['/api/analysis/packets'],
    queryFn: getPackets
  });

  // Fetch phone metadata
  const { 
    data: phoneMetadataData,
    isLoading: isPhoneMetadataLoading
  } = useQuery({
    queryKey: ['/api/phone/metadata'],
    queryFn: getAllPhoneMetadata
  });

  // Fetch geolocation data for traces
  const { 
    data: geolocationsData,
    isLoading: isGeolocationsLoading
  } = useQuery({
    queryKey: ['/api/geo/multiple'],
    queryFn: async () => {
      if (!tracesData?.traces?.length) return { success: true, geolocations: [], count: 0 };
      
      // Extract unique IPs from source and destination fields
      // In a real implementation, we'd use actual IPs
      const mockIps = [
        '192.168.1.45', '203.0.113.10', '198.51.100.22', 
        '172.16.254.1', '8.8.8.8', '45.60.75.90'
      ];
      
      return await getMultipleGeolocations(mockIps);
    },
    enabled: !!tracesData?.traces?.length
  });

  const onLiveViewClick = () => {
    toast({
      title: "Live View Activated",
      description: "Now showing real-time VoIP traffic data."
    });
  };

  const onUploadPcapClick = () => {
    toast({
      title: "Upload PCAP",
      description: "PCAP file upload functionality would open here."
    });
  };

  const onWhoisLookupClick = () => {
    if (!selectedNumber) return;
    
    toast({
      title: "WHOIS Lookup",
      description: `Performing WHOIS lookup for ${selectedNumber.phoneNumber}.`
    });
  };

  const onCallHistoryClick = () => {
    if (!selectedNumber) return;
    
    toast({
      title: "Call History",
      description: `Viewing call history for ${selectedNumber.phoneNumber}.`
    });
  };
  
  // Dashboard stats
  const stats = {
    activeVoipSessions: tracesData?.traces?.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    )?.length || 0,
    analyzedNumbers: phoneMetadataData?.metadata?.length || 0,
    suspiciousActivity: tracesData?.traces?.filter(t => t.type === 'Suspicious')?.length || 0,
    uniqueGeolocations: geolocationsData?.geolocations?.length || 0
  };

  return (
    <div>
      {/* PageHeader */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Real-time VoIP tracing and analysis
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Analysis
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatusCard
          title="Active VoIP Sessions"
          value={stats.activeVoipSessions}
          percentChange={8}
          icon={<Wifi size={20} />}
          iconBgColor="bg-primary"
          iconTextColor="text-primary"
        />
        <StatusCard
          title="Analyzed Numbers"
          value={stats.analyzedNumbers}
          percentChange={12}
          icon={<PhoneIcon size={20} />}
          iconBgColor="bg-secondary"
          iconTextColor="text-secondary"
        />
        <StatusCard
          title="Suspicious Activity"
          value={stats.suspiciousActivity}
          percentChange={3}
          icon={<AlertTriangle size={20} />}
          iconBgColor="bg-warning"
          iconTextColor="text-warning"
        />
        <StatusCard
          title="Unique Geolocations"
          value={stats.uniqueGeolocations}
          suffix="countries"
          icon={<Globe size={20} />}
          iconBgColor="bg-accent"
          iconTextColor="text-accent"
        />
      </div>

      {/* Map and Call Traces */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6">
        <MapVisualization
          geolocations={geolocationsData?.geolocations || []}
          isLoading={isGeolocationsLoading}
          onLiveViewClick={onLiveViewClick}
          footerText={`Showing data from ${tracesData?.count || 0} calls across ${geolocationsData?.count || 0} countries`}
        />
        <CallTraceList
          traces={tracesData?.traces || []}
          isLoading={isTracesLoading}
          onViewAllClick={() => {}}
        />
      </div>

      {/* Packet Analysis and Number Details */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2">
          <PacketAnalysisTable
            packets={packetsData?.packets || []}
            isLoading={isPacketsLoading}
            onFilterClick={() => {}}
            onUploadClick={onUploadPcapClick}
            footerText={`Showing ${packetsData?.packets?.length || 0} of ${packetsData?.count || 0} packets • Download full capture`}
          />
        </div>
        <div>
          <NumberDetails
            metadata={selectedNumber}
            isLoading={isPhoneMetadataLoading}
            onWhoisLookupClick={onWhoisLookupClick}
            onCallHistoryClick={onCallHistoryClick}
          />
        </div>
      </div>

      {/* API Services Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              API Services Status
            </h3>
            <button 
              onClick={() => refetchServices()}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <ApiStatusCards
            services={servicesData?.services || []}
            isLoading={isServicesLoading}
            onRefreshClick={() => refetchServices()}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
