import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { AiInsight } from '@shared/schema';

const AiInsightsPage = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [prompt, setPrompt] = useState('');
  const [centerId, setCenterId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch insights data based on selected center
  const { data: insights = [], isLoading, error } = useQuery({
    queryKey: ['/api/ai-insights', selectedCenter !== 'all' ? selectedCenter : null],
    queryFn: () => {
      if (selectedCenter !== 'all') {
        return api.getAiInsights(Number(selectedCenter));
      }
      return api.getAiInsights();
    },
  });
  
  const { data: centers = [] } = useQuery({
    queryKey: ['/api/centers'],
    queryFn: api.getCenters,
  });
  
  const generateInsightMutation = useMutation({
    mutationFn: ({ prompt, centerId }: { prompt: string, centerId?: number }) => {
      return api.generateAiInsight(prompt, centerId);
    },
    onSuccess: () => {
      // Invalidate AI insights queries with proper query key structure
      queryClient.invalidateQueries({ 
        queryKey: ['/api/ai-insights']
      });
      setIsDialogOpen(false);
      setPrompt('');
      setCenterId('');
      toast({
        title: "AI Insight Generated",
        description: "Your insight has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate insight",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  });
  
  // Filter insights based on search, center, and category
  const filteredInsights = insights.filter(insight => {
    const titleMatch = insight.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descriptionMatch = insight.description.toLowerCase().includes(searchQuery.toLowerCase());
    const centerMatch = selectedCenter === 'all' || insight.centerId === Number(selectedCenter);
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
    
    return (titleMatch || descriptionMatch) && centerMatch && categoryMatch;
  });
  
  // Get unique insight categories
  const categories = Array.from(new Set(insights.map(insight => insight.category)));
  
  const getCenterName = (centerId?: number) => {
    if (!centerId) return 'All Centers';
    const center = centers.find(c => c.id === centerId);
    return center?.name || `Center ${centerId}`;
  };
  
  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent w-5 h-5">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.21" />
            <path d="M21 3v9h-9" />
          </svg>
        );
      case 'attendance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning w-5 h-5">
            <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
            <path d="M8 12h8" />
            <path d="m8 17 4-4-4-4" />
          </svg>
        );
      case 'resource':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success w-5 h-5">
            <path d="M16 20h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h2" />
            <circle cx="10" cy="15" r="5" />
            <path d="m21 8-4.35 4.35" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent w-5 h-5">
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
  
  const handleGenerateInsight = () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Missing prompt",
        description: "Please provide a prompt for generating the insight.",
      });
      return;
    }
    
    generateInsightMutation.mutate({ 
      prompt, 
      centerId: centerId ? Number(centerId) : undefined
    });
  };
  
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">AI Insights</h1>
          <p className="text-gray-400">AI-powered analysis and insights for educational data</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
                  <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
                  <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
                  <path d="M12 17v-2" />
                  <path d="M8 19h8" />
                  <path d="M12 21v-2" />
                </svg>
                Generate New Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-secondary text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Generate AI Insight</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Provide a prompt for the AI to generate a meaningful insight.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Center (Optional)</label>
                  <Select value={centerId} onValueChange={setCenterId}>
                    <SelectTrigger className="bg-primary border-gray-700 text-white">
                      <SelectValue placeholder="Select a center" />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border-gray-700 text-white">
                      <SelectItem value="">All Centers</SelectItem>
                      {centers.map(center => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Analyze attendance patterns for the last month and suggest improvements"
                    className="bg-primary border-gray-700 text-white min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-700 text-white hover:bg-primary"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateInsight}
                  className="bg-accent hover:bg-accent/90"
                  disabled={generateInsightMutation.isPending}
                >
                  {generateInsightMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Insight'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Input
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary border-gray-700 text-white pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        
        <Select
          value={selectedCenter}
          onValueChange={setSelectedCenter}
        >
          <SelectTrigger className="bg-secondary border-gray-700 text-white">
            <SelectValue placeholder="Filter by center" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-gray-700 text-white">
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map(center => (
              <SelectItem key={center.id} value={center.id.toString()}>
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="bg-secondary border-gray-700 text-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-gray-700 text-white">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* AI Insights grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="bg-secondary shadow-md">
              <CardHeader className="px-5 py-4 border-b border-gray-700">
                <div className="h-6 bg-gray-700 rounded w-2/3"></div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6 mb-4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3 mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-secondary shadow-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p className="text-gray-400 mb-4">Failed to load AI insights</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredInsights.length === 0 ? (
        <Card className="bg-secondary shadow-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500 mb-4">
              <path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
              <path d="M2 9v1c0 2.97 2.16 5.43 5 5.91" />
              <path d="M22 9v1c0 2.97-2.16 5.43-5 5.91" />
              <path d="M12 17v-2" />
              <path d="M8 19h8" />
              <path d="M12 21v-2" />
            </svg>
            <p className="text-gray-400 mb-4">
              {searchQuery || selectedCenter !== 'all' || selectedCategory !== 'all'
                ? 'No insights match your search criteria'
                : 'No AI insights available yet'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Generate Your First Insight</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="bg-secondary shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getCategoryBgColor(insight.category)} flex items-center justify-center mr-3`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <CardTitle className="text-base font-medium text-white">{insight.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm text-gray-300 mb-4">{insight.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {insight.centerId ? `${getCenterName(insight.centerId)} • ` : ''}
                    {insight.generatedAt
                      ? format(new Date(insight.generatedAt), 'MMM d, yyyy')
                      : 'Recently generated'}
                  </div>
                  <Button 
                    variant="link" 
                    className="text-xs text-accent hover:text-accent/90 p-0"
                    onClick={() => navigate(`/ai-insights/${insight.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AiInsightsPage;
