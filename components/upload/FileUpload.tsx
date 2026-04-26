"use client";

import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  disabled,
  label = "Selecionar da galeria",
  className,
}: FileUploadProps) {
  return (
    <label className="block">
      <input
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onFileSelect(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className={className ?? "h-12 w-full rounded-2xl"}
        disabled={disabled}
      >
        <ImagePlus className="h-4 w-4" />
        {label}
      </Button>
    </label>
  );
}
