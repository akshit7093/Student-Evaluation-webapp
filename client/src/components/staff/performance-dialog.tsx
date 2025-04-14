import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface PerformanceDialogProps {
  staffId: number;
  staffName: string;
  triggerIcon?: React.ReactNode;
}

const PerformanceDialog = ({ staffId, staffName, triggerIcon }: PerformanceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number>(3);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // This is a placeholder - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Performance feedback saved",
        description: "The performance feedback has been recorded"
      });
      
      setOpen(false);
      setFeedback("");
      setRating(3);
    } catch (error) {
      toast({
        title: "Error saving feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="py-2 px-4">
          {triggerIcon}
          Add Performance Data
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-secondary text-white border-gray-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Record Performance</DialogTitle>
          <DialogDescription className="text-gray-400">
            Record performance metrics for {staffName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-white">Performance Rating</Label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`h-10 w-10 flex items-center justify-center rounded-md transition
                    ${
                      rating >= star
                        ? "bg-yellow-500 text-black"
                        : "bg-primary text-gray-400 hover:bg-primary-foreground"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white" htmlFor="feedback">
              Feedback and Notes
            </Label>
            <Textarea
              id="feedback"
              className="bg-primary border-gray-700 text-white min-h-[120px]"
              placeholder="Enter detailed feedback about performance, strengths, and areas for improvement..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-gray-700 text-white hover:bg-primary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-accent hover:bg-accent/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Performance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PerformanceDialog;