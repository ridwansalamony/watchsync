"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Konfirmasi",
  requiredText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  requiredText?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        setText("");
      }}
    >
      <DialogContent>
        <DialogTitle className="pr-8 font-heading text-xl">{title}</DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-7 text-muted-foreground">
          {description}
        </DialogDescription>
        {requiredText && (
          <div className="field mt-5">
            <label htmlFor="confirm-text">
              Ketik “{requiredText}” untuk melanjutkan
            </label>
            <Input
              id="confirm-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            disabled={busy || (!!requiredText && text !== requiredText)}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
                setText("");
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
