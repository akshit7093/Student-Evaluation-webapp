import { useParams } from 'wouter';
import DashboardLayout from "@/components/layout/dashboard-layout";
import EditCenterForm from "@/components/centers/edit-center-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditCenter() {
  const params = useParams<{ id: string }>();
  const centerId = parseInt(params.id, 10);

  if (isNaN(centerId)) {
    return (
      <DashboardLayout>
        <div className="bg-red-500/10 text-red-500 p-4 rounded-md">
          Invalid center ID.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Edit Center</h1>
        <p className="text-gray-400">Update educational center information</p>
      </div>

      <Card className="bg-secondary shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-700">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-accent">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Center Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EditCenterForm centerId={centerId} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}