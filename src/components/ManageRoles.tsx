import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserWithRole {
    id: string;
    name: string;
    profile_picture: string | null;
    role: "admin" | "member";
}

export const ManageRoles = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // Fetch all profiles
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, name, profile_picture")
                .order("name");

            if (profilesError) throw profilesError;

            // Fetch all roles
            const { data: roles, error: rolesError } = await supabase
                .from("user_roles")
                .select("user_id, role");

            if (rolesError) throw rolesError;

            // Combine data
            const combined = profiles.map((profile) => {
                const roleData = roles?.find((r) => r.user_id === profile.id);
                return {
                    ...profile,
                    role: (roleData?.role || "member") as "admin" | "member",
                };
            });

            setUsers(combined);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleRole = async (userId: string, currentRole: "admin" | "member") => {
        if (userId === currentUser?.id) {
            toast.error("You cannot change your own role");
            return;
        }

        const newRole = currentRole === "admin" ? "member" : "admin";

        try {
            if (newRole === "admin") {
                // Add admin role
                const { error } = await supabase
                    .from("user_roles")
                    .upsert({ user_id: userId, role: "admin" });
                if (error) throw error;
            } else {
                // Remove admin role (delete row or set to member)
                // Since the schema has a unique constraint or PK on user_id likely, upsert works.
                // But if we want to "remove" admin, we can set to member.
                const { error } = await supabase
                    .from("user_roles")
                    .upsert({ user_id: userId, role: "member" });
                if (error) throw error;
            }

            toast.success(`User role updated to ${newRole}`);
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update role");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Manage Roles
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Current Role</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profile_picture || undefined} />
                                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "admin"
                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                }`}
                                        >
                                            {user.role === "admin" ? "Admin" : "Member"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={user.role === "admin" ? "destructive" : "default"}
                                            size="sm"
                                            onClick={() => toggleRole(user.id, user.role)}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            {user.role === "admin" ? (
                                                <>
                                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                                    Demote
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                                    Promote
                                                </>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
