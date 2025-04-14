import { Card } from '@/components/ui/card';

type CenterStatsProps = {
  students: number;
  staff: number;
  attendance: number;
};

const CenterStats = ({ students, staff, attendance }: CenterStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <Card className="bg-primary rounded-lg p-4">
        <div className="text-gray-400 text-sm mb-1">Students</div>
        <div className="text-2xl font-bold text-white">{students}</div>
        <div className="mt-2 text-xs text-success flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span>5 new this month</span>
        </div>
      </Card>
      
      <Card className="bg-primary rounded-lg p-4">
        <div className="text-gray-400 text-sm mb-1">Staff</div>
        <div className="text-2xl font-bold text-white">{staff}</div>
        <div className="mt-2 text-xs text-success flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span>1 new this month</span>
        </div>
      </Card>
      
      <Card className="bg-primary rounded-lg p-4">
        <div className="text-gray-400 text-sm mb-1">Today's Attendance</div>
        <div className="text-2xl font-bold text-white">{attendance}%</div>
        <div className="mt-2 text-xs text-success flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span>6% above average</span>
        </div>
      </Card>
    </div>
  );
};

export default CenterStats;
