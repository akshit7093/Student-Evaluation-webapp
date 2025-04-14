import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuth, hasPermission } from '@/lib/auth';
import { useLocation } from 'wouter';

type AiInsightsProps = {
  centerId?: number | null;
};

const AiInsights = ({ centerId }: AiInsightsProps) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const { data: insights = [], isLoading, error } = useQuery({
    queryKey: [centerId ? `/api/ai-insights?centerId=${centerId}` : '/api/ai-insights'],
    queryFn: () => centerId ? api.getAiInsights(centerId) : api.getAiInsights(),
  });
  
  if (isLoading) {
    return (
      <Card className="bg-secondary rounded-lg shadow animate-pulse">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-5">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-secondary rounded-lg shadow">
        <CardHeader className="px-5 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white">AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col items-center justify-center text-center h-[300px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p className="text-gray-400">
            Could not load AI insights. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.21" />
            <path d="M21 3v9h-9" />
          </svg>
        );
      case 'attendance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
            <path d="M8 12h8" />
            <path d="m8 17 4-4-4-4" />
          </svg>
        );
      case 'resource':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M16 20h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h2" />
            <circle cx="10" cy="15" r="5" />
            <path d="m21 8-4.35 4.35" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
            <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
            <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
            <path d="M12 17v-2" />
            <path d="M8 19h8" />
            <path d="M12 21v-2" />
          </svg>
        );
    }
  };
  
  const getCategoryBgColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'bg-accent/20';
      case 'attendance':
        return 'bg-warning/20';
      case 'resource':
        return 'bg-success/20';
      default:
        return 'bg-accent/20';
    }
  };
  
  return (
    <Card className="bg-secondary rounded-lg shadow">
      <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
            <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
            <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
            <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
            <path d="M12 17v-2" />
            <path d="M8 19h8" />
            <path d="M12 21v-2" />
          </svg>
          AI Insights
        </CardTitle>
        <button type="button" className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <path d="M12 12 6.4 7.2" />
          </svg>
        </button>
      </CardHeader>
      <CardContent className="p-5">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
              <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
              <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
              <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
              <path d="M12 17v-2" />
              <path d="M8 19h8" />
              <path d="M12 21v-2" />
            </svg>
            <p className="text-gray-400 mb-4">No AI insights available</p>
            {hasPermission(user?.role, ['admin', 'founder', 'ghost', 'manager']) && (
              <Button 
                variant="outline"
                onClick={() => centerId && navigate(`/ai-insights?centerId=${centerId}`)}
              >
                Generate New Insight
              </Button>
            )}
          </div>
        ) : (
          <div>
            {insights.slice(0, 3).map((insight) => (
              <Card key={insight.id} className="bg-primary rounded-lg p-4 mb-5">
                <div className="flex items-center mb-3">
                  <div className={`w-8 h-8 rounded-full ${getCategoryBgColor(insight.category)} flex items-center justify-center`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <h3 className="ml-2 text-sm font-medium text-white">{insight.title}</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3">{insight.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {insight.generatedAt
                      ? `Generated on ${format(new Date(insight.generatedAt), 'MMM d, yyyy')}`
                      : 'Generated today'}
                  </span>
                  {hasPermission(user?.role, ['teacher', 'intern', 'admin', 'founder', 'ghost', 'manager']) && (
                    <button 
                      type="button" 
                      className="text-xs text-accent hover:text-accent/90"
                      onClick={() => navigate(`/ai-insights/${insight.id}`)}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Card>
            ))}

            {hasPermission(user?.role, ['admin', 'founder', 'ghost', 'manager']) && (
              <div className="mt-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => centerId && navigate(`/ai-insights?centerId=${centerId}`)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                    <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
                    <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
                    <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
                    <path d="M12 17v-2" />
                    <path d="M8 19h8" />
                    <path d="M12 21v-2" />
                  </svg>
                  Generate Custom Insight
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiInsights;
