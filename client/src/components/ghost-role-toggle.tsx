import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type GhostToggleProps = {
  className?: string;
};

const GhostRoleToggle = ({ className }: GhostToggleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    user?.role,
  );
  const [isGhostUser, setIsGhostUser] = useState<boolean>(false);

  useEffect(() => {
    // Check if this user's username is 'ghost' - this is the key identifier
    // Rather than checking the role, we only check the username
    if (user?.username === "ghost") {
      setIsGhostUser(true);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user?.role]);

  const handleRoleChange = async (role: string) => {
    if (!user) return;

    try {
      await api.updateUser(user.id, { role });
      setSelectedRole(role);
      toast({
        title: "Role Changed",
        description: `You are now viewing the application as a ${role.replace("_", " ")}`,
      });
      // Force a refresh to update permissions throughout the app
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change role. Please try again.",
      });
    }
  };

  // Only hide the toggle if it's not a ghost user by username
  // This way, even if they switch roles, the toggle remains visible
  if (!isGhostUser) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-xs text-emerald-400 font-semibold"></div>
      <Select value={selectedRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="h-8 w-40 bg-zinc-800 border-zinc-700 text-white">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
          <SelectItem value="ghost">Ghost</SelectItem>
          <SelectItem value="founder">Founder</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="center_manager">Center Manager</SelectItem>
          <SelectItem value="project_intern">Project Intern</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default GhostRoleToggle;
