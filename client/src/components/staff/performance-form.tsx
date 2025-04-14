import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Define the form schema using zod
const performanceSchema = z.object({
  rating: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 1 && num <= 5;
  }, {
    message: "Rating must be a number between 1 and 5",
  }),
  evaluationPeriod: z.string().min(1, "Evaluation period is required"),
  strengths: z.string().min(5, "Please provide at least 5 characters"),
  areasOfImprovement: z.string().min(5, "Please provide at least 5 characters"),
  additionalComments: z.string().optional(),
});

type PerformanceFormValues = z.infer<typeof performanceSchema>;

interface PerformanceFormProps {
  staffId: number;
  staffName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PerformanceForm({
  staffId,
  staffName,
  onSuccess,
  onCancel,
}: PerformanceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with defaults
  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      rating: "",
      evaluationPeriod: `${format(new Date(), 'MMMM yyyy')}`,
      strengths: "",
      areasOfImprovement: "",
      additionalComments: "",
    },
  });

  const onSubmit = async (values: PerformanceFormValues) => {
    setIsSubmitting(true);

    try {
      // In a real implementation, you would save this to the database
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would have API call to save performance data
      // const response = await apiRequest('/api/staff/performance', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     staffId,
      //     ...values,
      //     date: new Date().toISOString(),
      //   }),
      // });

      toast({
        title: "Performance data added",
        description: `Performance evaluation for ${staffName} has been saved successfully.`,
      });

      // Invalidate queries to refresh staff data
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${staffId}`] });
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting performance data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add performance data. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-1">
      <h2 className="text-xl font-semibold text-white mb-1">
        Add Performance Data
      </h2>
      <p className="text-gray-400 mb-4">
        Record performance metrics for {staffName}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Performance Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter rating (1-5)"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      className="bg-primary border-gray-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluationPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Period</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., March 2025"
                      className="bg-primary border-gray-700"
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
            name="strengths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Strengths</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter key strengths and achievements..."
                    className="bg-primary border-gray-700 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="areasOfImprovement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Areas for Improvement</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter areas that need improvement..."
                    className="bg-primary border-gray-700 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalComments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional comments or notes (optional)..."
                    className="bg-primary border-gray-700 min-h-[80px]"
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
              ) : "Save Performance Data"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}