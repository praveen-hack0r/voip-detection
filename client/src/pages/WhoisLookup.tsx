import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  getWhoisData,
  scanPorts,
  findRelatedDomains
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Globe, 
  Database,
  Server,
  Calendar,
  User,
  Building,
  MapPin,
  Mail,
  Phone as PhoneIcon
} from 'lucide-react';
import { WhoisData, PortScanResult } from '@/lib/types';
import { format, parseISO } from 'date-fns';

const WhoisLookup: React.FC = () => {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [host, setHost] = useState('');
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [portData, setPortData] = useState<PortScanResult[]>([]);
  const [relatedDomains, setRelatedDomains] = useState<string[]>([]);
  
  // Mutation for WHOIS lookup
  const whoisMutation = useMutation({
    mutationFn: (domain: string) => getWhoisData(domain),
    onSuccess: (data) => {
      setWhoisData(data.whoisData);
      toast({
        title: "WHOIS Lookup Complete",
        description: `Retrieved information for ${data.whoisData.domainName}`
      });
      
      // Also lookup related domains
      findRelatedDomainsMutation.mutate(domain);
    },
    onError: (error) => {
      toast({
        title: "WHOIS Lookup Error",
        description: `Failed to lookup domain: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for port scanning
  const portScanMutation = useMutation({
    mutationFn: (host: string) => scanPorts(host),
    onSuccess: (data) => {
      setPortData(data.scanResults);
      toast({
        title: "Port Scan Complete",
        description: `Scanned ${data.count} ports on ${host}`
      });
    },
    onError: (error) => {
      toast({
        title: "Port Scan Error",
        description: `Failed to scan ports: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for finding related domains
  const findRelatedDomainsMutation = useMutation({
    mutationFn: (domain: string) => findRelatedDomains(domain),
    onSuccess: (data) => {
      setRelatedDomains(data.relatedDomains);
    },
    onError: (error) => {
      console.error("Failed to find related domains:", error);
    }
  });
  
  const handleWhoisLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a domain name",
        variant: "destructive"
      });
      return;
    }
    
    whoisMutation.mutate(domain);
  };
  
  const handlePortScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a hostname or IP",
        variant: "destructive"
      });
      return;
    }
    
    portScanMutation.mutate(host);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WHOIS Lookup</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Analyze domains, IP ownership, and scan for open ports
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Domain WHOIS Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWhoisLookup} className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={whoisMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                disabled={whoisMutation.isPending || !domain.trim()}
                className="w-full"
              >
                {whoisMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Looking up...</span>
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    WHOIS Lookup
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Port Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePortScan} className="space-y-4">
              <div>
                <Label htmlFor="host">Hostname or IP</Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="example.com or 192.168.1.1"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={portScanMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                disabled={portScanMutation.isPending || !host.trim()}
                className="w-full"
              >
                {portScanMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Scanning...</span>
                  </div>
                ) : (
                  <>
                    <Server className="mr-2 h-4 w-4" />
                    Scan Ports
                  </>
                )}
              </Button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Scans common ports used by VoIP services (80, 443, 5060, 5061, etc.)
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {whoisData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                {whoisData.domainName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Registration Information</h3>
                  <div className="space-y-3">
                    <div className="flex">
                      <Database className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium">Registrar</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{whoisData.registrar}</div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium">Registration Dates</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Created: {formatDate(whoisData.creationDate)}<br />
                          Updated: {formatDate(whoisData.updatedDate)}<br />
                          Expires: {formatDate(whoisData.expirationDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium">Registrant</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {whoisData.registrantName || 'Private Registration'}<br />
                          {whoisData.registrantOrganization && (
                            <>{whoisData.registrantOrganization}<br /></>
                          )}
                          {whoisData.registrantCountry && (
                            <>Country: {whoisData.registrantCountry}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {(whoisData.contactEmail || whoisData.contactPhone) && (
                      <div className="flex">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium">Contact Information</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {whoisData.contactEmail && (
                              <>Email: {whoisData.contactEmail}<br /></>
                            )}
                            {whoisData.contactPhone && (
                              <>Phone: {whoisData.contactPhone}</>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Technical Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">Name Servers</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {whoisData.nameServers.map((ns, index) => (
                          <div key={index}>{ns}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {whoisData.status.map((status, index) => (
                          <div key={index}>{status}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Domain ID</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {whoisData.registryDomainId || 'Not available'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Related Domains</CardTitle>
            </CardHeader>
            <CardContent>
              {findRelatedDomainsMutation.isPending ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : relatedDomains.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No related domains found
                </div>
              ) : (
                <ul className="space-y-2">
                  {relatedDomains.map((domain, index) => (
                    <li key={index} className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <button 
                        className="text-primary hover:underline text-left"
                        onClick={() => {
                          setDomain(domain);
                          whoisMutation.mutate(domain);
                        }}
                      >
                        {domain}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {portData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Open Ports for {host}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Port
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      State
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Version
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {portData.map((port, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {port.port}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {port.service}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          port.state === 'open' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : port.state === 'filtered'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {port.state}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {port.version || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {portData.filter(p => p.state === 'open').length} of {portData.length} ports open
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default WhoisLookup;
