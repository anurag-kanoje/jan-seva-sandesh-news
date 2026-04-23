import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Shield } from "lucide-react";

interface UserWithRole {
  user_id: string;
  full_name: string;
  created_at: string;
  role: string | null;
  role_id: string | null;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch all profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false });
    // Fetch all roles
    const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");

    const roleMap = new Map<string, { role: string; id: string }>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, { role: r.role, id: r.id }));

    setUsers(
      (profiles ?? []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        created_at: p.created_at,
        role: roleMap.get(p.user_id)?.role ?? null,
        role_id: roleMap.get(p.user_id)?.id ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const assignRole = async (userId: string, role: string) => {
    if (role === "user") {
      await removeRole(userId);
      return;
    }

    // Check if user already has a role
    const existing = users.find((u) => u.user_id === userId);
    if (existing?.role_id) {
      // Update existing role
      const { error } = await supabase.from("user_roles").update({ role: role as any }).eq("id", existing.role_id);
      if (error) { toast({ title: "त्रुटि", description: error.message, variant: "destructive" }); return; }
    } else {
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) { toast({ title: "त्रुटि", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: `भूमिका "${role}" सेट की गई` });
    fetchUsers();
  };

  const removeRole = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) { toast({ title: "त्रुटि", description: error.message, variant: "destructive" }); return; }
    toast({ title: "भूमिका हटाई गई" });
    fetchUsers();
  };

  const roleBadge = (role: string | null) => {
    if (role === "admin") return <Badge className="bg-primary">एडमिन</Badge>;
    if (role === "writer") return <Badge className="bg-green-600">लेखक</Badge>;
    return <Badge variant="secondary">सामान्य</Badge>;
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">उपयोगकर्ता प्रबंधन</h1>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाम</TableHead>
                <TableHead>भूमिका</TableHead>
                <TableHead>जुड़ने की तिथि</TableHead>
                <TableHead>कार्रवाई</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">लोड हो रहा है...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">कोई उपयोगकर्ता नहीं</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("hi-IN")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select value={u.role ?? "user"} onValueChange={(val) => assignRole(u.user_id, val)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="भूमिका चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">सामान्य</SelectItem>
                            <SelectItem value="writer">लेखक</SelectItem>
                            <SelectItem value="admin">एडमिन</SelectItem>
                          </SelectContent>
                        </Select>
                        {u.role && (
                          <Button variant="ghost" size="icon" onClick={() => removeRole(u.user_id)} title="भूमिका हटाएं">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
