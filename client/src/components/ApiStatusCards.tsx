import React from 'react';
import { Card } from '@/components/ui/card';
import { ApiService } from '@/lib/types';
import { Phone, MapPin, Search, Activity } from 'lucide-react';

interface ApiStatusCardsProps {
  services: ApiService[];
  isLoading?: boolean;
  onRefreshClick?: () => void;
}

const ApiStatusCards: React.FC<ApiStatusCardsProps> = ({
  services,
  isLoading = false,
  onRefreshClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.toLowerCase().includes('phone')) {
      return <Phone className="text-green-600 dark:text-green-400" size={20} />;
    }
    if (name.toLowerCase().includes('geo') || name.toLowerCase().includes('ip')) {
      return <MapPin className="text-green-600 dark:text-green-400" size={20} />;
    }
    if (name.toLowerCase().includes('whois')) {
      return <Search className="text-amber-600 dark:text-amber-400" size={20} />;
    }
    return <Activity className="text-green-600 dark:text-green-400" size={20} />;
  };

  const getServiceBgColor = (name: string) => {
    if (name.toLowerCase().includes('phone')) {
      return 'bg-green-100 dark:bg-green-900';
    }
    if (name.toLowerCase().includes('geo') || name.toLowerCase().includes('ip')) {
      return 'bg-green-100 dark:bg-green-900';
    }
    if (name.toLowerCase().includes('whois')) {
      return 'bg-amber-100 dark:bg-amber-900';
    }
    return 'bg-green-100 dark:bg-green-900';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg p-6">
            <div className="animate-pulse flex items-center">
              <div className="rounded-md bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
              <div className="ml-5 w-full space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => (
        <Card key={service.id} className="bg-gray-50 dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${getServiceBgColor(service.name)}`}>
                {getServiceIcon(service.name)}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {service.name}
                  </dt>
                  <dd className="flex items-center">
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full ${getStatusColor(service.status)} mr-2`}></span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{service.status}</span>
                    </div>
                  </dd>
                  {service.quotaRemaining !== undefined && (
                    <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {service.quotaRemaining}% of quota remaining
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ApiStatusCards;
