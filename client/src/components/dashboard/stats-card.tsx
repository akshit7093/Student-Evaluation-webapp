import { Card } from '@/components/ui/card';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
    text: string;
  };
  iconBgColor?: string;
  className?: string;
};

const StatsCard = ({
  title,
  value,
  icon,
  change,
  iconBgColor = 'bg-accent/20',
  className = '',
}: StatsCardProps) => {
  return (
    <Card className={`bg-secondary rounded-lg shadow px-5 py-6 ${className}`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-semibold text-white">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{change.text}</span>
            <span
              className={`flex items-center text-sm font-medium ${
                change.isPositive ? 'text-success' : 'text-red-500'
              }`}
            >
              {change.isPositive ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
              {change.value}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
