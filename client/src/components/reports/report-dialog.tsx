import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReportForm from "./report-form";
import { useState } from "react";

interface ReportDialogProps {
  centerId: number;
  triggerText?: string;
  triggerIcon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  className?: string;
}

export default function ReportDialog({
  centerId,
  triggerText = "Generate Report",
  triggerIcon,
  variant = "default",
  className = "bg-accent hover:bg-accent/90",
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          {triggerIcon}
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] bg-secondary border-gray-700">
        <ReportForm 
          centerId={centerId} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </DialogContent>
    </Dialog>
  );
}