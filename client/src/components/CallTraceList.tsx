import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Phone, Globe, ArrowRight, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoipTrace } from '@/lib/types';

interface CallTraceListProps {
  traces: VoipTrace[];
  isLoading?: boolean;
  onViewAllClick?: () => void;
}

const CallTraceList: React.FC<CallTraceListProps> = ({
  traces,
  isLoading = false,
  onViewAllClick,
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  };
  
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
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

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Recent Call Traces
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onViewAllClick}>
            View All
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-hidden overflow-y-auto h-80">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : traces.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center p-6">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No call traces available</p>
            </div>
          </div>
        ) : (
          traces.map((trace) => (
            <div key={trace.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center">
                    <Phone className="text-secondary mr-2 h-4 w-4" />
                    <span>{trace.phoneNumber}</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(trace.type)}`}>
                      {trace.type}
                    </span>
                  </p>
                  <div className="mt-1 flex items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <Globe className="inline-block mr-1 h-3 w-3" />
                      <span>{trace.originLocation}</span>
                      <ArrowRight className="inline-block mx-2 h-3 w-3" />
                      <span>{trace.destinationLocation}</span>
                    </p>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span title={new Date(trace.timestamp).toLocaleString()}>
                        {formatDistanceToNow(new Date(trace.timestamp), { addSuffix: true })}
                      </span>
                      <span className="mx-1">•</span>
                      <span>{formatDuration(trace.duration)}</span>
                      {trace.serviceProvider && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{trace.serviceProvider}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CallTraceList;
