import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatusCardProps {
  title: string;
  value: number | string;
  percentChange?: number;
  icon: React.ReactNode;
  iconBgColor: string; // tailwind bg color class
  iconTextColor: string; // tailwind text color class
  suffix?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  percentChange,
  icon,
  iconBgColor,
  iconTextColor,
  suffix
}) => {
  const isPositiveChange = percentChange && percentChange > 0;
  const changeTextColor = isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <Card className="bg-white dark:bg-gray-800 overflow-hidden shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} bg-opacity-10 rounded-md p-3`}>
            <div className={`${iconTextColor} text-xl`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {value}
                </div>
                {percentChange !== undefined && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold">
                    <div className={`flex items-center ${changeTextColor}`}>
                      <ArrowUp className={`h-4 w-4 ${!isPositiveChange ? 'rotate-180' : ''}`} />
                      <span className="ml-1">{Math.abs(percentChange)}%</span>
                    </div>
                  </div>
                )}
                {suffix && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-500 dark:text-gray-400">
                    <span className="ml-1">{suffix}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatusCard;
