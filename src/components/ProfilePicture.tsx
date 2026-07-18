import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Camera, X, User } from "lucide-react";

interface ProfilePictureProps {
  userId: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  editable?: boolean;
  onUpdate?: () => void;
}

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const ICON_SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function ProfilePicture({
  userId,
  size = "md",
  className = "",
  editable = false,
  onUpdate,
}: ProfilePictureProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    api<{ image_data: string; mime_type: string }>(`/auth/profile-picture/${userId}`)
      .then((data) => {
        setImageData(data.image_data);
        setMimeType(data.mime_type);
      })
      .catch(() => {
        setImageData(null);
      });
  }, [userId]);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleUpload = async (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await api("/auth/profile-picture", {
        method: "POST",
        body: { image_data: base64, mime_type: file.type },
      });

      setImageData(base64);
      setMimeType(file.type);
      setShowMenu(false);
      onUpdate?.();
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await api("/auth/profile-picture", { method: "DELETE" });
      setImageData(null);
      setShowMenu(false);
      onUpdate?.();
    } catch {
      // silently fail
    }
  };

  const initials = "U";

  const sizeClasses = SIZE_MAP[size];
  const iconSize = ICON_SIZE_MAP[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      {imageData ? (
        <img
          src={`data:${mimeType};base64,${imageData}`}
          alt="Profile"
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-background`}
        />
      ) : (
        <div
          className={`${sizeClasses} flex items-center justify-center rounded-full bg-primary-soft text-primary ring-2 ring-background`}
        >
          <User className={iconSize} />
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={uploading}
            className="absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Camera className="h-3 w-3" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              className="absolute top-full left-1/2 z-50 mt-2 w-44 -translate-x-1/2 rounded-xl border border-border bg-card p-1.5 shadow-lg"
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                {uploading ? "Uploading..." : "Upload photo"}
              </button>
              {imageData && (
                <button
                  onClick={handleRemove}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove photo
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
