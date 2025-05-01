import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getPackets,
  captureLiveTraffic,
  analyzePacketFile,
  getVoipMetadata
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import PacketAnalysisTable from '@/components/PacketAnalysisTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Filter,
  RefreshCw
} from 'lucide-react';

const PacketAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [captureActive, setCaptureActive] = useState(false);
  const [captureDuration, setCaptureDuration] = useState(10);
  
  // Fetch packet data
  const { 
    data: packetsData,
    isLoading: isPacketsLoading,
    refetch: refetchPackets
  } = useQuery({
    queryKey: ['/api/analysis/packets'],
    queryFn: getPackets
  });
  
  // Fetch VoIP metadata
  const { 
    data: voipMetadata,
    isLoading: isVoipMetadataLoading,
    refetch: refetchVoipMetadata
  } = useQuery({
    queryKey: ['/api/analysis/voip-metadata'],
    queryFn: getVoipMetadata
  });
  
  // Mutation for starting live capture
  const captureMutation = useMutation({
    mutationFn: (duration: number) => captureLiveTraffic(duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/packets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/voip-metadata'] });
      toast({
        title: "Capture Complete",
        description: `Successfully captured ${captureDuration} seconds of traffic.`
      });
      setCaptureActive(false);
    },
    onError: (error) => {
      toast({
        title: "Capture Error",
        description: `Failed to capture traffic: ${error.message}`,
        variant: "destructive"
      });
      setCaptureActive(false);
    }
  });
  
  // Mutation for analyzing PCAP file
  const analyzeFileMutation = useMutation({
    mutationFn: (fileId: string) => analyzePacketFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/packets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/voip-metadata'] });
      toast({
        title: "Analysis Complete",
        description: "Successfully analyzed PCAP file."
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Error",
        description: `Failed to analyze PCAP file: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleCaptureStart = () => {
    if (captureActive) return;
    
    setCaptureActive(true);
    toast({
      title: "Capture Started",
      description: `Capturing traffic for ${captureDuration} seconds...`
    });
    
    captureMutation.mutate(captureDuration);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real implementation, we would upload the file to the server
    // For now, just simulate the upload with a mock fileId
    toast({
      title: "File Upload",
      description: `Uploading file ${files[0].name}...`
    });
    
    setTimeout(() => {
      analyzeFileMutation.mutate("mock-file-id");
    }, 1000);
    
    // Reset the input
    e.target.value = '';
  };
  
  const handleRefresh = () => {
    refetchPackets();
    refetchVoipMetadata();
  };
  
  const handleDownload = () => {
    toast({
      title: "Download PCAP",
      description: "Downloading the full packet capture..."
    });
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Packet Analysis</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Analyze SIP/VoIP packets and extract metadata
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isPacketsLoading || captureMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isPacketsLoading || !packetsData?.packets?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PCAP
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Capture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (seconds)
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={captureDuration}
                  onChange={(e) => setCaptureDuration(parseInt(e.target.value))}
                  min={1}
                  max={60}
                  disabled={captureActive || captureMutation.isPending}
                />
              </div>
              <Button 
                onClick={handleCaptureStart}
                disabled={captureActive || captureMutation.isPending}
                className="mt-5"
              >
                {captureActive || captureMutation.isPending ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Capture
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {captureActive || captureMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                  <span>Capturing live traffic...</span>
                </div>
              ) : (
                <span>Capture SIP/VoIP packets from your network</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload PCAP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PCAP files only</p>
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    accept=".pcap,.pcapng"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={analyzeFileMutation.isPending}
                  />
                </label>
              </div>
              {analyzeFileMutation.isPending && (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  <span>Analyzing file...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>VoIP Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {isVoipMetadataLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !voipMetadata?.metadata ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No VoIP metadata available
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">SIP Packets:</span>
                    <span className="font-medium">{voipMetadata.metadata.callCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Unique Endpoints:</span>
                    <span className="font-medium">{voipMetadata.metadata.endpoints?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active Sessions:</span>
                    <span className="font-medium">{voipMetadata.metadata.sessions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Unique Calls:</span>
                    <span className="font-medium">{voipMetadata.metadata.calls?.length || 0}</span>
                  </div>
                  {voipMetadata.metadata.codecs?.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Detected Codecs:</span>
                      <div className="flex flex-wrap gap-1">
                        {voipMetadata.metadata.codecs.map((codec: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {codec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {voipMetadata.metadata.methodDistribution && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      SIP Methods Distribution
                    </span>
                    {Object.entries(voipMetadata.metadata.methodDistribution).map(([method, count]: [string, any]) => (
                      <div key={method} className="mb-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{method}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (count / voipMetadata.metadata.callCount) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <PacketAnalysisTable
        packets={packetsData?.packets || []}
        isLoading={isPacketsLoading}
        onFilterClick={() => {
          toast({
            title: "Filter Packets",
            description: "Packet filtering functionality would open here."
          });
        }}
        onUploadClick={() => {
          document.getElementById('dropzone-file')?.click();
        }}
        footerText={`Showing ${packetsData?.packets?.length || 0} of ${packetsData?.count || 0} packets • Download full capture`}
      />
    </div>
  );
};

export default PacketAnalysis;
