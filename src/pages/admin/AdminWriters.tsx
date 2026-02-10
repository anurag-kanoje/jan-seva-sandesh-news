import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, UserCheck } from "lucide-react";

interface WriterProfile {
  user_id: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

const AdminWriters = () => {
  const { toast } = useToast();
  const [writers, setWriters] = useState<WriterProfile[]>([]);
  const [newWriterEmail, setNewWriterEmail] = useState("");

  const fetchWriters = async () => {
    // Get all users with writer role
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "writer");
    if (!roles?.length) { setWriters([]); return; }
    
    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, is_active, created_at")
      .in("user_id", userIds);
    setWriters(profiles ?? []);
  };

  useEffect(() => { fetchWriters(); }, []);

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentActive }).eq("user_id", userId);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: !currentActive ? "लेखक सक्रिय" : "लेखक निष्क्रिय" }); fetchWriters(); }
  };

  const removeWriter = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "writer");
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: "लेखक भूमिका हटाई" }); fetchWriters(); }
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold">लेखक प्रबंधन</h1>
        <p className="text-sm text-muted-foreground">
          नया लेखक जोड़ने के लिए, पहले उन्हें साइन अप करवाएं, फिर उनकी user_id से user_roles में writer role जोड़ें।
        </p>
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>नाम</TableHead>
                <TableHead>स्थिति</TableHead>
                <TableHead>जुड़ने की तिथि</TableHead>
                <TableHead>कार्रवाई</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {writers.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">कोई लेखक नहीं</TableCell></TableRow>
              )}
              {writers.map((w) => (
                <TableRow key={w.user_id}>
                  <TableCell className="font-medium">{w.full_name || "—"}</TableCell>
                  <TableCell>
                    {w.is_active ? <Badge className="bg-green-600">सक्रिय</Badge> : <Badge variant="destructive">निष्क्रिय</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleDateString("hi-IN")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(w.user_id, w.is_active)} title={w.is_active ? "निष्क्रिय करें" : "सक्रिय करें"}>
                        {w.is_active ? <UserMinus className="w-4 h-4 text-yellow-600" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeWriter(w.user_id)} title="भूमिका हटाएं">
                        <UserMinus className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWriters;
