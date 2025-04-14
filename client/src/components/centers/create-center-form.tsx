import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Create a schema for the center form based on insertCenterSchema
const centerFormSchema = z.object({
  name: z.string().min(3, { message: "Center name must be at least 3 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }).default("Delhi"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  managerId: z.number().nullable().optional(),
  active: z.boolean().default(true),
});

type CenterFormValues = z.infer<typeof centerFormSchema>;

interface CreateCenterFormProps {
  onSuccess?: () => void;
}

export default function CreateCenterForm({ onSuccess }: CreateCenterFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default random location within Delhi (approximately)
  const getRandomDelhiLocation = () => {
    // Delhi approximate bounds
    const delhiLat = 28.65 + (Math.random() * 0.1 - 0.05);
    const delhiLng = 77.22 + (Math.random() * 0.1 - 0.05);
    return { lat: delhiLat, lng: delhiLng };
  };

  const defaultValues: CenterFormValues = {
    name: "",
    address: "",
    city: "Delhi",
    location: getRandomDelhiLocation(),
    managerId: null,
    active: true,
  };

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues,
  });

  const createCenter = useMutation({
    mutationFn: async (data: CenterFormValues) => {
      const response = await apiRequest("POST", "/api/centers", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create center");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate centers query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/centers'] });
      // Invalidate dashboard stats to update counts
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: "Center created successfully",
        description: "The new educational center has been added.",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise navigate back to centers list
        navigate("/centers");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create center",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CenterFormValues) => {
    setIsSubmitting(true);
    try {
      await createCenter.mutateAsync(data);
    } catch (error) {
      // Error is handled in the mutation
      console.error("Error creating center:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center Name</FormLabel>
              <FormControl>
                <Input placeholder="Laxmi Nagar Education Center" {...field} />
              </FormControl>
              <FormDescription>
                The official name of the education center.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main Street, Laxmi Nagar" {...field} />
              </FormControl>
              <FormDescription>
                The complete physical address of the center.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Delhi" {...field} />
              </FormControl>
              <FormDescription>
                The city where the center is located. Defaults to Delhi.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Set to active if this center is currently operational.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/centers")}
            disabled={isSubmitting}
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
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Center"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}