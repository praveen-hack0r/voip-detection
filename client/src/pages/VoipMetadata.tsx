import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getAllPhoneMetadata,
  lookupPhoneNumber,
  getVoipTraces
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import NumberDetails from '@/components/NumberDetails';
import CallTraceList from '@/components/CallTraceList';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Phone as PhoneIcon,
  InfoIcon,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { NumberMetadata } from '@/lib/types';

const VoipMetadata: React.FC = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<NumberMetadata | undefined>();
  
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
  
  // Mutation for phone lookup
  const lookupMutation = useMutation({
    mutationFn: (number: string) => {
      console.log('Looking up phone number:', number);
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
            <RefreshCw className="mr-2 h-4 w-4" />
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
      
      <CallTraceList
        traces={tracesData?.traces || []}
        isLoading={isTracesLoading}
        onViewAllClick={() => {}}
      />
    </div>
  );
};

export default VoipMetadata;
