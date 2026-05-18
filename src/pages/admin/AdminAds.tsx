import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ImageUpload";
import { Pencil, Trash2, Plus, ExternalLink } from "lucide-react";

const SLOTS = [
  { value: "home-top", label: "होम पेज - ऊपर" },
  { value: "home-mid", label: "होम पेज - बीच में" },
  { value: "home-sidebar", label: "होम पेज - साइडबार" },
  { value: "article-top", label: "लेख - ऊपर" },
  { value: "article-bottom", label: "लेख - नीचे" },
  { value: "category-top", label: "श्रेणी पेज - ऊपर" },
];

interface Ad {
  id: string;
  slot: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  html: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  created_at: string;
}

const empty = {
  id: "",
  slot: "home-top",
  title: "",
  image_url: "",
  link_url: "",
  html: "",
  active: true,
  starts_at: "",
  ends_at: "",
  priority: 0,
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const AdminAds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "लोड विफल", description: error.message, variant: "destructive" });
    setAds((data as Ad[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(empty);
    setEditing(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "शीर्षक आवश्यक है", variant: "destructive" });
      return;
    }
    if (!form.image_url && !form.html?.trim()) {
      toast({ title: "छवि या HTML में से एक आवश्यक है", variant: "destructive" });
      return;
    }
    const payload = {
      slot: form.slot,
      title: form.title.trim(),
      image_url: form.image_url || null,
      link_url: form.link_url?.trim() || null,
      html: form.html?.trim() || null,
      active: form.active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      priority: Number(form.priority) || 0,
      created_by: user?.id,
    };

    const { error } = editing
      ? await supabase.from("ads").update(payload).eq("id", form.id)
      : await supabase.from("ads").insert(payload);

    if (error) {
      toast({ title: "सहेजने में त्रुटि", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "विज्ञापन अपडेट हुआ" : "विज्ञापन जोड़ा गया" });
    reset();
    load();
  };

  const edit = (a: Ad) => {
    setEditing(true);
    setForm({
      id: a.id,
      slot: a.slot,
      title: a.title,
      image_url: a.image_url || "",
      link_url: a.link_url || "",
      html: a.html || "",
      active: a.active,
      starts_at: toLocalInput(a.starts_at),
      ends_at: toLocalInput(a.ends_at),
      priority: a.priority,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (a: Ad) => {
    const { error } = await supabase.from("ads").update({ active: !a.active }).eq("id", a.id);
    if (error) toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("क्या आप इस विज्ञापन को हटाना चाहते हैं?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) toast({ title: "हटाने में त्रुटि", description: error.message, variant: "destructive" });
    else {
      toast({ title: "हटा दिया गया" });
      load();
    }
  };

  const slotLabel = (s: string) => SLOTS.find((x) => x.value === s)?.label ?? s;
  const isLive = (a: Ad) => {
    if (!a.active) return false;
    const now = Date.now();
    if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
    if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
    return true;
  };

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-2xl font-heading font-bold">प्रायोजित विज्ञापन</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {editing ? "विज्ञापन संपादित करें" : "नया विज्ञापन जोड़ें"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>स्लॉट</Label>
                <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>शीर्षक / प्रायोजक</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>विज्ञापन छवि</Label>
                {user && (
                  <ImageUpload
                    userId={user.id}
                    currentUrl={form.image_url}
                    onUpload={(url) => setForm({ ...form, image_url: url })}
                  />
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>क्लिक URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>HTML (वैकल्पिक - छवि के स्थान पर)</Label>
                <Textarea
                  rows={3}
                  placeholder="<a href='...'>...</a>"
                  value={form.html}
                  onChange={(e) => setForm({ ...form, html: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>प्रारंभ (वैकल्पिक)</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>समाप्ति (वैकल्पिक)</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>प्राथमिकता</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label className="cursor-pointer">सक्रिय</Label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">{editing ? "अपडेट करें" : "जोड़ें"}</Button>
                {editing && (
                  <Button type="button" variant="outline" onClick={reset}>रद्द करें</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">सभी विज्ञापन ({ads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">लोड हो रहा है...</p>
            ) : ads.length === 0 ? (
              <p className="text-sm text-muted-foreground">अभी कोई विज्ञापन नहीं है।</p>
            ) : (
              <div className="space-y-3">
                {ads.map((a) => (
                  <div key={a.id} className="flex flex-col md:flex-row gap-3 items-start border border-border rounded-md p-3">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.title} className="w-full md:w-32 h-20 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{a.title}</h3>
                        <Badge variant="outline">{slotLabel(a.slot)}</Badge>
                        {isLive(a) ? (
                          <Badge className="bg-green-600">LIVE</Badge>
                        ) : (
                          <Badge variant="secondary">निष्क्रिय</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        प्राथमिकता: {a.priority}
                        {a.starts_at && ` • प्रारंभ ${new Date(a.starts_at).toLocaleString("hi-IN")}`}
                        {a.ends_at && ` • समाप्ति ${new Date(a.ends_at).toLocaleString("hi-IN")}`}
                      </p>
                      {a.link_url && (
                        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent inline-flex items-center gap-1 mt-1">
                          {a.link_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                      <Button size="icon" variant="outline" onClick={() => edit(a)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => remove(a.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAds;
