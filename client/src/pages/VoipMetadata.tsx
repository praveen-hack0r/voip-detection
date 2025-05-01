import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getAllPhoneMetadata,
  lookupPhoneNumber,
  getVoipTraces,
  getVoipMetadata,
  captureLiveTraffic
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import NumberDetails from '@/components/NumberDetails';
import CallTraceList from '@/components/CallTraceList';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Phone as PhoneIcon,
  Info as InfoIcon,
  ShieldAlert,
  AlertCircle,
  RotateCw,
  ArrowRight,
  ArrowLeftRight,
  Phone,
  Play,
  Activity
} from 'lucide-react';
import { NumberMetadata } from '@/lib/types';

interface CallSession {
  callId: string;
  methods: string[];
  endpoints: string[];
  packets: number;
  sipPackets: number;
  rtpPackets: number;
  duration: number;
  codec: string;
  callState: {
    setup: boolean;
    connected: boolean;
    mediaEstablished: boolean;
    terminated: boolean;
  };
  rtpDetails?: {
    payloadType: number;
    firstSeqNum: number;
    lastSeqNum: number;
    packetCount: number;
    mediaSize: number;
  } | null;
  callDuration?: number;
}

const VoipMetadata: React.FC = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<NumberMetadata | undefined>();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('phone-db');
  
  // Fetch phone metadata
  const { 
    data: phoneMetadataData,
    isLoading: isPhoneMetadataLoading,
    refetch: refetchPhoneMetadata
  } = useQuery({
    queryKey: ['/api/phone/metadata'],
    queryFn: getAllPhoneMetadata
  });
  
  // Fetch VoIP traces
  const { 
    data: tracesData,
    isLoading: isTracesLoading
  } = useQuery({
    queryKey: ['/api/phone/traces'],
    queryFn: getVoipTraces
  });
  
  // Fetch VoIP call metadata
  const {
    data: voipMetadataData,
    isLoading: isVoipMetadataLoading,
    refetch: refetchVoipMetadata
  } = useQuery({
    queryKey: ['/api/analysis/voip-metadata'],
    queryFn: getVoipMetadata
  });
  
  // Mutation for live capture
  const captureMutation = useMutation({
    mutationFn: (duration: number = 10) => {
      return captureLiveTraffic(duration);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/voip-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/packets'] });
      
      toast({
        title: "Live Capture Complete",
        description: `Captured ${data.packets?.length || 0} packets`
      });
    },
    onError: (error) => {
      toast({
        title: "Capture Error",
        description: `Failed to capture live traffic: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Start a live capture
  const handleLiveCapture = () => {
    captureMutation.mutate(10);
  };
  
  // Mutation for phone lookup
  const lookupMutation = useMutation({
    mutationFn: (number: string) => {
      console.log('Looking up phone number:', number);
      // Pass the phone number as a proper object to match API expectations
      return lookupPhoneNumber(number);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone/metadata'] });
      
      toast({
        title: "Phone Lookup Complete",
        description: `Successfully retrieved metadata for ${data.metadata.phoneNumber}`
      });
      
      setSelectedNumber(data.metadata);
    },
    onError: (error) => {
      console.error('Phone lookup error:', error);
      toast({
        title: "Lookup Error",
        description: `Failed to lookup phone number: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }
    
    lookupMutation.mutate(phoneNumber);
  };
  
  const handleSelectNumber = (number: NumberMetadata) => {
    setSelectedNumber(number);
  };
  
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'voip':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'virtual':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };
  
  const getRiskIcon = (score?: number) => {
    if (score === undefined) return <InfoIcon className="h-5 w-5 text-gray-400" />;
    if (score < 30) return <PhoneIcon className="h-5 w-5 text-green-500" />;
    if (score < 60) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <ShieldAlert className="h-5 w-5 text-red-500" />;
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">VoIP Metadata</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Analyze and trace VoIP and virtual phone numbers
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => refetchPhoneMetadata()}>
            <RotateCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Phone Number Lookup</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={lookupMutation.isPending}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      disabled={lookupMutation.isPending || !phoneNumber.trim()}
                      className="w-full"
                    >
                      {lookupMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Looking up...</span>
                        </div>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Lookup
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Enter a phone number to lookup metadata, origin, and risk analysis.
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="shadow mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Phone Number Database</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Number
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPhoneMetadataLoading ? (
                <div className="flex justify-center items-center h-60">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !phoneMetadataData?.metadata?.length ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No phone metadata available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Provider
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Risk
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {phoneMetadataData.metadata.map((number) => (
                        <tr 
                          key={number.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                            ${selectedNumber?.id === number.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          `}
                          onClick={() => handleSelectNumber(number)}
                        >
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {number.phoneNumber}
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(number.type)}`}>
                              {number.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {number.provider || 'Unknown'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {number.location || 'Unknown'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {getRiskIcon(number.riskScore)}
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                {number.riskScore || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm">
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNumber(number);
                            }}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {phoneMetadataData?.metadata?.length || 0} phone numbers
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <NumberDetails
            metadata={selectedNumber}
            isLoading={isPhoneMetadataLoading}
            onWhoisLookupClick={() => {
              toast({
                title: "WHOIS Lookup",
                description: `Performing WHOIS lookup for ${selectedNumber?.phoneNumber}.`
              });
            }}
            onCallHistoryClick={() => {
              toast({
                title: "Call History",
                description: `Viewing call history for ${selectedNumber?.phoneNumber}.`
              });
            }}
          />
        </div>
      </div>
      
      {/* VoIP Call Analysis */}
      <Card className="shadow mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>VoIP Call Analysis</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLiveCapture}
              disabled={captureMutation.isPending}
            >
              {captureMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  <span>Capturing...</span>
                </div>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Capture Live Traffic
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isVoipMetadataLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !voipMetadataData?.metadata?.calls?.length ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No VoIP call data available. Start a live capture to view call details.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Calls</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {voipMetadataData.metadata.calls.length}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active Calls</div>
                  <div className="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">
                    {voipMetadataData.metadata.activeCallCount || 0}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">SIP Packets</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {voipMetadataData.metadata.sipPacketCount || 0}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">RTP Packets</div>
                  <div className="text-xl font-semibold text-purple-600 dark:text-purple-400 mt-1">
                    {voipMetadataData.metadata.rtpPacketCount || 0}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Call Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Call ID
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Codec
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Packets
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {voipMetadataData.metadata.calls.map((call: CallSession) => (
                        <tr 
                          key={call.callId} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                            ${selectedCallId === call.callId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          `}
                          onClick={() => setSelectedCallId(call.callId)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs font-mono text-gray-900 dark:text-white">
                              {call.callId.substring(0, 12)}...
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {call.callState.terminated ? (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Completed
                              </Badge>
                            ) : call.callState.connected ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Connected
                              </Badge>
                            ) : call.callState.setup ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                Setting Up
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Unknown
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {call.codec || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{call.packets}</span>
                              <span className="text-xs">({call.sipPackets} SIP, {call.rtpPackets} RTP)</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {call.callDuration ? 
                              `${Math.round(call.callDuration / 1000)}s` : 
                              `${Math.round(call.duration / 1000)}s`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCallId(call.callId);
                              
                              toast({
                                title: "Call Details",
                                description: `Viewing details for call ${call.callId.substring(0, 8)}...`
                              });
                            }}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {selectedCallId && (
                <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    Call Flow Details
                  </h3>
                  {(() => {
                    const selectedCall = voipMetadataData.metadata.calls.find(
                      (c: CallSession) => c.callId === selectedCallId
                    );
                    
                    if (!selectedCall) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Call ID</div>
                            <div className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {selectedCall.callId}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                            <div className="flex space-x-1">
                              <Badge className={selectedCall.callState.setup ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                Setup
                              </Badge>
                              <Badge className={selectedCall.callState.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                Connected
                              </Badge>
                              <Badge className={selectedCall.callState.mediaEstablished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                Media
                              </Badge>
                              <Badge className={selectedCall.callState.terminated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                Terminated
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">SIP Methods</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedCall.methods.map((method, i) => (
                                <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                  {method}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Audio Codec</div>
                            <Badge variant="outline" className="bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                              {selectedCall.codec || 'Unknown'}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</div>
                            <div className="text-sm font-medium">
                              {selectedCall.callDuration ? 
                                `${Math.round(selectedCall.callDuration / 1000)} seconds` : 
                                `${Math.round(selectedCall.duration / 1000)} seconds`}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Endpoints</div>
                          <div className="flex flex-col space-y-2">
                            {selectedCall.endpoints.map((endpoint, i) => (
                              <div key={i} className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                                <span className="text-sm font-mono">{endpoint}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {selectedCall.rtpDetails && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RTP Details</div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Payload Type</div>
                                  <div className="text-sm font-medium">{selectedCall.rtpDetails.payloadType}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">RTP Packets</div>
                                  <div className="text-sm font-medium">{selectedCall.rtpDetails.packetCount}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Sequence Range</div>
                                  <div className="text-sm font-medium">{selectedCall.rtpDetails.firstSeqNum} - {selectedCall.rtpDetails.lastSeqNum}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Media Size</div>
                                  <div className="text-sm font-medium">{Math.round(selectedCall.rtpDetails.mediaSize / 1024)} KB</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
        {!isVoipMetadataLoading && voipMetadataData?.metadata && (
          <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between w-full">
              <div>
                Total VoIP Endpoints: {voipMetadataData.metadata.voipEndpoints?.length || 0}
              </div>
              <div>
                {Object.keys(voipMetadataData.metadata.methodDistribution || {}).length > 0 && 
                  `SIP Methods: ${Object.keys(voipMetadataData.metadata.methodDistribution).join(', ')}`}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <CallTraceList
        traces={tracesData?.traces || []}
        isLoading={isTracesLoading}
        onViewAllClick={() => {}}
      />
    </div>
  );
};

export default VoipMetadata;
