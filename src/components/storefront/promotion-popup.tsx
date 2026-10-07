"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
export function PromotionPopup({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!text) return;
    try {
      if (sessionStorage.getItem("motoshop-promo") === text) return;
    } catch {}
    const timer = setTimeout(() => setOpen(true), 1000);
    return () => clearTimeout(timer);
  }, [text]);
  function close(next: boolean) {
    setOpen(next);
    if (!next)
      try {
        sessionStorage.setItem("motoshop-promo", text);
      } catch {}
  }
  if (!text) return null;
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thông tin từ MotoShop</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {text}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
