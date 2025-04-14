import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Define the form schema using zod
const workEntrySchema = z.object({
  centerName: z.string().min(1, "Center name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  achievements: z.string().min(5, "Please provide at least 5 characters"),
  notes: z.string().optional(),
});

type WorkEntryFormValues = z.infer<typeof workEntrySchema>;

interface WorkEntryFormProps {
  staffId: number;
  staffName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function WorkEntryForm({
  staffId,
  staffName,
  onSuccess,
  onCancel,
}: WorkEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with defaults
  const form = useForm<WorkEntryFormValues>({
    resolver: zodResolver(workEntrySchema),
    defaultValues: {
      centerName: "",
      position: "",
      startDate: "",
      endDate: "",
      achievements: "",
      notes: "",
    },
  });

  const onSubmit = async (values: WorkEntryFormValues) => {
    setIsSubmitting(true);

    try {
      // In a real implementation, you would save this to the database
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would have API call to save work entry
      // const response = await apiRequest('/api/staff/work-history', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     staffId,
      //     ...values,
      //   }),
      // });

      toast({
        title: "Work entry added",
        description: `Work history entry for ${staffName} has been saved successfully.`,
      });

      // Invalidate queries to refresh staff data
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${staffId}`] });
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting work entry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add work entry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-1">
      <h2 className="text-xl font-semibold text-white mb-1">
        Add Work History Entry
      </h2>
      <p className="text-gray-400 mb-4">
        Record work history for {staffName}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="centerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter center name"
                      className="bg-primary/40 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-primary/40 border-gray-700">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-gray-700">
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="center_manager">Center Manager</SelectItem>
                        <SelectItem value="project_intern">Project Intern</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="coordinator">Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-primary/40 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Leave blank if current)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-primary/40 border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="achievements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Achievements</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter key achievements and responsibilities..."
                    className="bg-primary/40 border-gray-700 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes or comments..."
                    className="bg-primary/40 border-gray-700 min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : "Save Work Entry"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}