import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  userId: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ImageUpload = ({ userId, currentUrl, onUpload }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "केवल JPG, PNG, WebP फ़ाइलें अनुमत हैं", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "फ़ाइल 5MB से छोटी होनी चाहिए", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(30);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    setProgress(60);
    const { error } = await supabase.storage.from("article-images").upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "अपलोड विफल", description: error.message, variant: "destructive" });
      setUploading(false);
      setProgress(0);
      return;
    }

    setProgress(90);
    const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    setPreview(publicUrl);
    onUpload(publicUrl);
    setProgress(100);
    setUploading(false);
    toast({ title: "छवि अपलोड सफल" });
  };

  return (
    <div className="space-y-2">
      {preview && (
        <div className="relative w-full h-40 rounded-md overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => { setPreview(""); onUpload(""); }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="gap-2">
        {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        {uploading ? "अपलोड हो रहा है..." : "छवि अपलोड करें"}
      </Button>
      {uploading && <Progress value={progress} className="h-1" />}
    </div>
  );
};

export default ImageUpload;
