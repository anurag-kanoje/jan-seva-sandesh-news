import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { generateSlug } from "@/lib/slug";
import { canSubmitArticle } from "@/lib/rate-limit";
import { useAutosave, loadDraft, clearDraft } from "@/hooks/useAutosave";

interface Category { id: string; name: string; }

interface Draft {
  title: string; content: string; excerpt: string; categoryId: string; imageUrl: string;
}

const ArticleForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const draftKey = `article-draft:${id || "new"}`;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initialLoaded = useRef(false);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  // Load existing article OR draft
  useEffect(() => {
    const loadIt = async () => {
      if (id) {
        const { data } = await supabase.from("articles").select("*").eq("id", id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setExcerpt(data.excerpt ?? "");
          setCategoryId(data.category_id ?? "");
          setImageUrl(data.image_url ?? "");
        }
      }
      const draft = loadDraft<Draft>(draftKey);
      if (draft && (draft.title || draft.content)) {
        setTitle((t) => t || draft.title);
        setContent((c) => c || draft.content);
        setExcerpt((e) => e || draft.excerpt);
        setCategoryId((c) => c || draft.categoryId);
        setImageUrl((u) => u || draft.imageUrl);
        toast({ title: "ड्राफ्ट पुनर्स्थापित किया गया", description: "स्थानीय रूप से सहेजा गया मसौदा लोड हुआ।" });
      }
      initialLoaded.current = true;
    };
    loadIt();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (initialLoaded.current) setDirty(true);
  }, [title, content, excerpt, categoryId, imageUrl]);

  useAutosave<Draft>(draftKey, { title, content, excerpt, categoryId, imageUrl }, dirty);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty && !saving) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saving]);

  const slugPreview = useMemo(() => generateSlug(title) || "...", [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (title.trim().length < 5) {
      toast({ title: "शीर्षक कम से कम 5 अक्षर का होना चाहिए", variant: "destructive" });
      return;
    }
    if (content.trim().length < 50) {
      toast({ title: "सामग्री कम से कम 50 अक्षर की होनी चाहिए", variant: "destructive" });
      return;
    }
    if (!canSubmitArticle()) {
      toast({ title: "कृपया कुछ सेकंड प्रतीक्षा करें", variant: "destructive" });
      return;
    }

    setSaving(true);

    const articleData: any = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      category_id: categoryId || null,
      image_url: imageUrl.trim() || null,
      author_id: user.id,
    };

    if (!isEditing) {
      // Generate clean English slug via AI translation of (Hindi) title
      try {
        const { data: slugData, error: slugErr } = await supabase.functions.invoke("generate-slug", {
          body: { title: title.trim() },
        });
        if (slugErr) throw slugErr;
        articleData.slug = slugData?.slug || generateSlug(title) || `news-${Date.now()}`;
      } catch {
        articleData.slug = `${generateSlug(title) || "news"}-${Math.random().toString(36).slice(2, 6)}`;
      }
      articleData.status = "pending";
      articleData.views = 0;
    }

    const { error } = isEditing
      ? await supabase.from("articles").update(articleData).eq("id", id!)
      : await supabase.from("articles").insert(articleData);

    setSaving(false);

    if (error) {
      toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    } else {
      clearDraft(draftKey);
      setDirty(false);
      toast({ title: isEditing ? "लेख अपडेट हुआ" : "लेख सबमिट हुआ" });
      navigate(role === "admin" ? "/admin/articles" : "/writer/articles");
    }
  };

  const discardDraft = () => {
    clearDraft(draftKey);
    toast({ title: "ड्राफ्ट हटाया गया" });
  };

  return (
    <DashboardLayout type={role === "admin" ? "admin" : "writer"}>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-heading font-bold">{isEditing ? "लेख संपादित करें" : "नया लेख लिखें"}</h1>
          {dirty && <span className="text-xs text-muted-foreground">अनसहेजे बदलाव • स्वतः सहेजा जा रहा है</span>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">शीर्षक * (कम से कम 5 अक्षर)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            <p className="text-xs text-muted-foreground">URL slug स्वचालित रूप से शीर्षक से अंग्रेज़ी में बनेगा (जैसे: rte-school-row)।</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">सारांश</Label>
            <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">श्रेणी</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="श्रेणी चुनें" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>छवि</Label>
            {user && <ImageUpload userId={user.id} currentUrl={imageUrl} onUpload={setImageUrl} />}
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="या URL डालें https://..." className="mt-2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">सामग्री * (कम से कम 50 अक्षर)</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">{content.length} अक्षर</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button type="submit" disabled={saving || !dirty}>{saving ? "सहेज रहे हैं..." : isEditing ? "अपडेट करें" : "सबमिट करें"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>रद्द करें</Button>
            <Button type="button" variant="ghost" onClick={discardDraft}>ड्राफ्ट हटाएँ</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ArticleForm;
