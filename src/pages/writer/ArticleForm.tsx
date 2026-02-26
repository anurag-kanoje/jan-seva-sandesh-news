import { useEffect, useState } from "react";
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
import { generateUniqueSlug } from "@/lib/slug";
import { canSubmitArticle } from "@/lib/rate-limit";

interface Category {
  id: string;
  name: string;
}

const ArticleForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id, name").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (id) {
      supabase.from("articles").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setExcerpt(data.excerpt ?? "");
          setCategoryId(data.category_id ?? "");
          setImageUrl(data.image_url ?? "");
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (title.trim().length < 5) {
      toast({ title: "शीर्षक कम से कम 5 अक्षर का होना चाहिए", variant: "destructive" });
      return;
    }
    if (content.trim().length < 50) {
      toast({ title: "सामग्री कम से कम 50 अक्षर की होनी चाहिए", variant: "destructive" });
      return;
    }

    // Rate limit
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
      articleData.slug = generateUniqueSlug(title);
      articleData.status = "pending";
      articleData.views = 0;
    }

    let error;
    if (isEditing) {
      ({ error } = await supabase.from("articles").update(articleData).eq("id", id!));
    } else {
      ({ error } = await supabase.from("articles").insert(articleData));
    }
    setSaving(false);

    if (error) {
      toast({ title: "त्रुटि", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isEditing ? "लेख अपडेट हुआ" : "लेख सबमिट हुआ" });
      navigate("/writer/articles");
    }
  };

  return (
    <DashboardLayout type="writer">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-heading font-bold">{isEditing ? "लेख संपादित करें" : "नया लेख लिखें"}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">शीर्षक * (कम से कम 5 अक्षर)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
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
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "सहेज रहे हैं..." : isEditing ? "अपडेट करें" : "सबमिट करें"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/writer/articles")}>रद्द करें</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ArticleForm;
