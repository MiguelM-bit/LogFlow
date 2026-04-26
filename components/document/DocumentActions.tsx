"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentStatus } from "@/types";

interface DocumentActionsProps {
  status: DocumentStatus;
  loading: boolean;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function DocumentActions({
  status,
  loading,
  onApprove,
  onReject,
}: DocumentActionsProps) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const disabled = loading || status === "approved";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="success"
          disabled={disabled}
          onClick={() => void onApprove()}
        >
          Aprovar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || status === "rejected"}
          onClick={() => setShowReject((prev) => !prev)}
        >
          Rejeitar
        </Button>
      </div>

      {showReject && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo da rejeição"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || !reason.trim()}
            onClick={() => void onReject(reason.trim())}
          >
            Confirmar rejeição
          </Button>
        </div>
      )}
    </div>
  );
}
