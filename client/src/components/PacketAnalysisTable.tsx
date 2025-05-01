import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PacketData } from '@/lib/types';
import { Filter, Upload } from 'lucide-react';

interface PacketAnalysisTableProps {
  packets: PacketData[];
  isLoading?: boolean;
  onFilterClick?: () => void;
  onUploadClick?: () => void;
  footerText?: string;
}

const PacketAnalysisTable: React.FC<PacketAnalysisTableProps> = ({
  packets,
  isLoading = false,
  onFilterClick,
  onUploadClick,
  footerText
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  const getProtocolClass = (protocol: string) => {
    switch (protocol.toUpperCase()) {
      case 'SIP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'RTP':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'TCP':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UDP':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Packet Analysis
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onFilterClick}>
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm" onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-1" />
              Upload PCAP
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : packets.length === 0 ? (
          <div className="flex justify-center items-center h-60">
            <div className="text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No packet data available</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Destination
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Protocol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Info
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm font-mono">
              {packets.map((packet) => (
                <tr key={packet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-2 whitespace-nowrap">
                    {formatTime(packet.timestamp)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    {packet.source}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    {packet.destination}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProtocolClass(packet.protocol)}`}>
                      {packet.protocol}
                    </span>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap truncate max-w-xs">
                    {packet.info}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {footerText && (
        <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {footerText}
        </CardFooter>
      )}
    </Card>
  );
};

export default PacketAnalysisTable;
