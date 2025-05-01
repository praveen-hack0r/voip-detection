import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVoipTraces, getAllPhoneMetadata } from '@/lib/api';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Search, ArrowRight, Phone, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { VoipTrace, NumberMetadata } from '@/lib/types';

const History: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Fetch VoIP traces
  const { 
    data: tracesData,
    isLoading: isTracesLoading
  } = useQuery({
    queryKey: ['/api/phone/traces'],
    queryFn: getVoipTraces
  });
  
  // Fetch phone metadata
  const { 
    data: phoneMetadataData,
    isLoading: isPhoneMetadataLoading
  } = useQuery({
    queryKey: ['/api/phone/metadata'],
    queryFn: getAllPhoneMetadata
  });
  
  // Filter traces based on search, type, and date range
  const filteredTraces = (tracesData?.traces || []).filter(trace => {
    // Search filter
    if (searchQuery && !trace.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.originLocation.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.destinationLocation.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(trace.serviceProvider && trace.serviceProvider.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Type filter
    if (selectedType !== 'all' && trace.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    
    // Date range filter
    const traceDate = new Date(trace.timestamp);
    if (dateFrom && traceDate < dateFrom) {
      return false;
    }
    if (dateTo) {
      // Include the entire day for "to" date
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      if (traceDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
  
  // Group traces by date
  const groupedTraces: Record<string, VoipTrace[]> = {};
  filteredTraces.forEach(trace => {
    const date = format(new Date(trace.timestamp), 'yyyy-MM-dd');
    if (!groupedTraces[date]) {
      groupedTraces[date] = [];
    }
    groupedTraces[date].push(trace);
  });
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTraces).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Format duration
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  // Get metadata for a phone number
  const getMetadataForNumber = (phoneNumber: string): NumberMetadata | undefined => {
    return phoneMetadataData?.metadata?.find(m => m.phoneNumber === phoneNumber);
  };
  
  // Get type colors
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
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call History</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and analyze historical VoIP call traces
          </p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="search"
                  placeholder="Phone, location, provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">Call Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="voip">VoIP</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="dateFrom"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="dateTo"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredTraces.length} of {tracesData?.traces?.length || 0} calls
          </div>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </CardFooter>
      </Card>
      
      {isTracesLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTraces.length === 0 ? (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No call history matches your filters</p>
          {(searchQuery || selectedType !== 'all' || dateFrom || dateTo) && (
            <Button variant="link" onClick={clearFilters}>
              Clear filters and try again
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {format(parseISO(date), 'PPPP')}
              </h2>
              
              <div className="space-y-3">
                {groupedTraces[date].map((trace) => {
                  const metadata = getMetadataForNumber(trace.phoneNumber);
                  
                  return (
                    <Card key={trace.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex items-start md:items-center flex-wrap">
                            <div className="mr-4 flex items-center">
                              <Phone className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-lg font-medium text-gray-900 dark:text-white">
                                {trace.phoneNumber}
                              </span>
                              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(trace.type)}`}>
                                {trace.type}
                              </span>
                            </div>
                            
                            <div className="md:mr-4 mt-2 md:mt-0 flex items-center">
                              <Globe className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-gray-600 dark:text-gray-300">
                                {trace.originLocation}
                              </span>
                              <ArrowRight className="mx-2 h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">
                                {trace.destinationLocation}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 md:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {format(new Date(trace.timestamp), 'h:mm a')}
                            </span>
                            <span className="mx-1">•</span>
                            <span>{formatDuration(trace.duration)}</span>
                            {trace.serviceProvider && (
                              <>
                                <span className="mx-1">•</span>
                                <span>{trace.serviceProvider}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {metadata && metadata.riskScore !== undefined && (
                          <div className="mt-3 flex items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mr-2">Risk Score:</div>
                            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  metadata.riskScore < 30 ? 'bg-green-500' : 
                                  metadata.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${metadata.riskScore}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {metadata.riskScore}%
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
