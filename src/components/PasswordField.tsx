import { useMemo, useState } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordFieldProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  allowGenerate?: boolean;
  onGenerate?: (password: string) => void;
}

const createStrongPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*_-+=?";
  const all = upper + lower + numbers + symbols;

  const picks = [upper, lower, numbers, symbols].map(
    (charset) => charset[Math.floor(Math.random() * charset.length)],
  );

  while (picks.length < 12) {
    picks.push(all[Math.floor(Math.random() * all.length)]);
  }

  return picks.sort(() => Math.random() - 0.5).join("");
};

const PasswordField = ({ className, allowGenerate = false, onGenerate, ...props }: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  const inputPaddingClass = useMemo(
    () => (allowGenerate ? "pr-24" : "pr-12"),
    [allowGenerate],
  );

  const handleGenerate = () => {
    const nextPassword = createStrongPassword();
    onGenerate?.(nextPassword);
    props.onChange?.({ target: { value: nextPassword } } as React.ChangeEvent<HTMLInputElement>);
    setVisible(true);
  };

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputPaddingClass, className)}
      />
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        {allowGenerate && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleGenerate}
            aria-label="सुरक्षित पासवर्ड बनाएं"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "पासवर्ड छुपाएं" : "पासवर्ड दिखाएं"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PasswordField;