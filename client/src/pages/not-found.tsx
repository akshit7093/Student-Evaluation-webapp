import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NotFound() {
  const [_, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  const goBack = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className={`w-full max-w-md mx-4 ${isMobile ? 'shadow-lg' : ''}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">Page Not Found</h1>
          </div>

          <p className="mt-4 text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={goBack} className="w-full">
            Go to Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
