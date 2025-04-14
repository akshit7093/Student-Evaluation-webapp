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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface WorkEntryDialogProps {
  staffId: number;
  staffName: string;
  triggerIcon?: React.ReactNode;
}

const WorkEntryDialog = ({ staffId, staffName, triggerIcon }: WorkEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [workType, setWorkType] = useState("teaching");
  const [hoursWorked, setHoursWorked] = useState("4");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // This is a placeholder - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Work entry saved",
        description: `Successfully logged ${hoursWorked} hours on ${date ? format(date, 'PPP') : 'unknown date'}`
      });
      
      setOpen(false);
      setDate(new Date());
      setWorkType("teaching");
      setHoursWorked("4");
      setNotes("");
    } catch (error) {
      toast({
        title: "Error saving work entry",
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
          Add Work Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-secondary text-white border-gray-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Log Work Hours</DialogTitle>
          <DialogDescription className="text-gray-400">
            Record work details for {staffName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-white">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left text-white bg-primary border-gray-700 hover:bg-primary"
                >
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-gray-700 bg-secondary">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="bg-secondary border-gray-700 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Work Type</Label>
            <Select
              value={workType}
              onValueChange={setWorkType}
            >
              <SelectTrigger className="bg-primary border-gray-700 text-white">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-gray-700 text-white">
                <SelectItem value="teaching">Teaching</SelectItem>
                <SelectItem value="admin">Administrative</SelectItem>
                <SelectItem value="training">Training/Workshop</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Hours Worked</Label>
            <Input 
              type="number" 
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              min="0.5"
              max="24"
              step="0.5"
              className="bg-primary border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white" htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              className="bg-primary border-gray-700 text-white min-h-[100px]"
              placeholder="Enter details about the work performed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkEntryDialog;