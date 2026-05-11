import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { UserMinus, UserCheck, Check, X } from "lucide-react";

interface WriterProfile {
  user_id: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface Application {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  full_name?: string;
}

const AdminWriters = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [writers, setWriters] = useState<WriterProfile[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "writer");
    if (roles?.length) {
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name, is_active, created_at").in("user_id", userIds);
      setWriters(profiles ?? []);
    } else setWriters([]);

    const { data: applications } = await supabase
      .from("writer_applications" as any)
      .select("id, user_id, reason, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (applications?.length) {
      const ids = (applications as any[]).map((a) => a.user_id);
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const nameMap = new Map((profs ?? []).map((p) => [p.user_id, p.full_name]));
      setApps((applications as any[]).map((a) => ({ ...a, full_name: nameMap.get(a.user_id) })));
    } else setApps([]);
  };

  useEffect(() => { fetchAll(); }, []);

  const decide = async (appId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("writer_applications" as any)
      .update({ status, review_notes: notes[appId] ?? "", reviewed_by: user?.id })
      .eq("id", appId);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: status === "approved" ? "आवेदन स्वीकृत" : "आवेदन अस्वीकृत" }); fetchAll(); }
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentActive }).eq("user_id", userId);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: !currentActive ? "लेखक सक्रिय" : "लेखक निष्क्रिय" }); fetchAll(); }
  };

  const removeWriter = async (userId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "writer");
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else { toast({ title: "लेखक भूमिका हटाई" }); fetchAll(); }
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-8">
        <section className="space-y-3">
          <h1 className="text-2xl font-heading font-bold">लंबित लेखक आवेदन ({apps.length})</h1>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">कोई लंबित आवेदन नहीं।</p>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div key={a.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("hi-IN")}</p>
                    </div>
                    <Badge className="bg-yellow-600">समीक्षाधीन</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{a.reason}</p>
                  <Textarea
                    placeholder="समीक्षा टिप्पणी (वैकल्पिक)..."
                    rows={2}
                    value={notes[a.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(a.id, "approved")}>
                      <Check className="w-4 h-4 mr-1" /> स्वीकृत करें
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(a.id, "rejected")}>
                      <X className="w-4 h-4 mr-1" /> अस्वीकृत करें
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-heading font-bold">सक्रिय लेखक</h2>
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
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminWriters;
