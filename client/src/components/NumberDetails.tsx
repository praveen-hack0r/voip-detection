import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NumberMetadata } from '@/lib/types';
import { Search, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NumberDetailsProps {
  metadata?: NumberMetadata;
  isLoading?: boolean;
  onWhoisLookupClick?: () => void;
  onCallHistoryClick?: () => void;
}

const NumberDetails: React.FC<NumberDetailsProps> = ({
  metadata,
  isLoading = false,
  onWhoisLookupClick,
  onCallHistoryClick
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const getTypeClass = (type: string) => {
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
  
  const getRiskColor = (score?: number) => {
    if (score === undefined) return 'bg-gray-500';
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getRiskText = (score?: number) => {
    if (score === undefined) return 'Unknown';
    if (score < 30) return 'Low';
    if (score < 60) return 'Medium';
    return 'High';
  };

  return (
    <Card className="shadow rounded-lg h-full">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Number Details
        </CardTitle>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          {metadata ? 'Phone number information' : 'Select a number from the list or search to view details'}
        </p>
      </CardHeader>
      
      <CardContent className="px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : !metadata ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No phone number selected</p>
          </div>
        ) : (
          <>
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Number</span>
              <span className="text-gray-900 dark:text-white font-medium">{metadata.phoneNumber}</span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Type</span>
              <span className="text-gray-900 dark:text-white flex items-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClass(metadata.type)}`}>
                  {metadata.type}
                </span>
              </span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Provider</span>
              <span className="text-gray-900 dark:text-white">{metadata.provider || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Location</span>
              <span className="text-gray-900 dark:text-white">{metadata.location || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">First Seen</span>
              <span className="text-gray-900 dark:text-white">{formatDate(metadata.firstSeen)}</span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Last Call</span>
              <span className="text-gray-900 dark:text-white">{formatDate(metadata.lastSeen)}</span>
            </div>
            
            <div className="flex items-center py-2">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3">Risk Score</span>
              <span className="flex items-center">
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getRiskColor(metadata.riskScore)} rounded-full`} 
                    style={{ width: `${metadata.riskScore || 0}%` }}
                  ></div>
                </div>
                <span className={`ml-2 font-medium ${metadata.riskScore && metadata.riskScore > 50 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {getRiskText(metadata.riskScore)} ({metadata.riskScore || 0}%)
                </span>
              </span>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3 w-full">
          <Button className="flex-1" onClick={onWhoisLookupClick} disabled={!metadata}>
            <Search className="mr-2 h-4 w-4" />
            WHOIS Lookup
          </Button>
          <Button variant="outline" className="flex-1" onClick={onCallHistoryClick} disabled={!metadata}>
            <History className="mr-2 h-4 w-4" />
            Call History
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NumberDetails;
