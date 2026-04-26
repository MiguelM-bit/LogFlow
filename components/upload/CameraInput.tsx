"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraInputProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function CameraInput({
  onFileSelect,
  disabled,
  label = "Tirar foto",
  className,
}: CameraInputProps) {
  return (
    <label className="block">
      <input
        type="file"
        accept="image/*"
        capture="environment"
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
        variant="secondary"
        className={className ?? "h-12 w-full rounded-2xl"}
        disabled={disabled}
      >
        <Camera className="h-4 w-4" />
        {label}
      </Button>
    </label>
  );
}
