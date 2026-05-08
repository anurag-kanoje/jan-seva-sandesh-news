import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  userId: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const ImageUpload = ({ userId, currentUrl, onUpload }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl || "");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = "केवल JPG, PNG, WebP फ़ाइलें अनुमत हैं";
      setErrorMsg(msg);
      toast({ title: msg, variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      const msg = "फ़ाइल 5MB से छोटी होनी चाहिए";
      setErrorMsg(msg);
      toast({ title: msg, variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setUploading(true);
    setProgress(15);

    // Stage progress until upload completes (Supabase JS does not expose XHR progress)
    const ticker = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p));
    }, 200);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("article-images").upload(path, file, { upsert: true });

    clearInterval(ticker);

    if (error) {
      setErrorMsg(error.message);
      toast({ title: "अपलोड विफल", description: error.message, variant: "destructive" });
      setUploading(false);
      setProgress(0);
      return;
    }

    const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    setPreview(publicUrl);
    onUpload(publicUrl);
    setProgress(100);
    setUploading(false);
    toast({ title: "छवि अपलोड सफल" });
  };

  const reset = () => {
    setPreview("");
    setFileName("");
    setFileSize(0);
    setErrorMsg("");
    setProgress(0);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {preview && (
        <div className="relative w-full h-40 rounded-md overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={reset}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="gap-2">
          {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {uploading ? "अपलोड हो रहा है..." : preview ? "बदलें" : "छवि अपलोड करें"}
        </Button>
        {fileName && (
          <span className="text-xs text-muted-foreground truncate max-w-[240px]">
            {fileName} • {formatSize(fileSize)}
          </span>
        )}
      </div>
      {uploading && <Progress value={progress} className="h-1" />}
      {errorMsg && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errorMsg}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
