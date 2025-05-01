import React from 'react';
import { Input } from '@/components/ui/input';
import { Bell, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  openSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ openSidebar }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    toast({
      title: "Search initiated",
      description: `Searching for: ${searchQuery}`,
    });
    
    // In a real implementation, this would trigger a search API call
    setSearchQuery('');
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:px-6">
      <div className="flex md:hidden">
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={openSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex items-center flex-1">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            type="text"
            className="block w-full pl-10 pr-3 py-2"
            placeholder="Search for phone numbers, IPs, domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-1 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        
        <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
        
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-sm font-medium">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
