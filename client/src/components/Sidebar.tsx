import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, ActivitySquare, Phone, MapPin, Search, History, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  closeMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeMobile }) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(to);
    const onClick = closeMobile ? closeMobile : undefined;

    return (
      <Link href={to} onClick={onClick}>
        <a
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            active
              ? 'bg-gray-900 dark:bg-gray-800 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span className={`mr-3 ${active ? 'text-primary-light' : 'text-gray-400'}`}>{icon}</span>
          {label}
        </a>
      </Link>
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-800 dark:bg-gray-900 border-r border-gray-700">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
        <div className="flex items-center">
          <div className="text-xl font-bold text-white flex items-center">
            <Shield className="mr-2 text-primary-light" />
            <span>VoIP Tracer</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink to="/" icon={<ActivitySquare size={20} />} label="Dashboard" />
          <NavLink to="/packet-analysis" icon={<ActivitySquare size={20} />} label="Packet Analysis" />
          <NavLink to="/voip-metadata" icon={<Phone size={20} />} label="VoIP Metadata" />
          <NavLink to="/geolocation" icon={<MapPin size={20} />} label="Geolocation" />
          <NavLink to="/whois-lookup" icon={<Search size={20} />} label="WHOIS Lookup" />
          <NavLink to="/history" icon={<History size={20} />} label="History" />
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <div className="mt-2">
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <Settings className="mr-3 text-gray-400" size={20} />
              Settings
            </a>
            <a href="#" className="flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <HelpCircle className="mr-3 text-gray-400" size={20} />
              Help & Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
