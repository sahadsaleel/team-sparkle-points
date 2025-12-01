import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCog } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminManageRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  profile: {
    name: string;
  };
}

export const AdminManageRolesDialog = ({ open, onOpenChange }: AdminManageRolesDialogProps) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserRoles();
    }
  }, [open]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          profiles!inner(name)
        `)
        .order('profiles(name)');

      if (error) throw error;

      const formatted = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        profile: {
          name: item.profiles.name
        }
      })) || [];

      setUserRoles(formatted);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role updated to ${newRole}`,
      });

      fetchUserRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Manage User Roles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : userRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            userRoles.map((userRole) => (
              <div
                key={userRole.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{userRole.profile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current role: <span className="font-medium">{userRole.role}</span>
                  </p>
                </div>

                <Select
                  value={userRole.role}
                  onValueChange={(value) => handleRoleChange(userRole.user_id, value as 'admin' | 'member')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
