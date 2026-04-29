"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { useToastStore, type Toast } from "@/store/toast.store";
import { cn } from "@/lib/utils";

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onRemove(toast.id), 3000);
    return () => window.clearTimeout(timeout);
  }, [onRemove, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 24, y: 8 }}
      transition={{ duration: 0.18 }}
    >
      <Card
        padding="sm"
        className={cn(
          "min-w-64 border-l-4 shadow-xl",
          toast.type === "success" && "border-l-sage",
          toast.type === "error" && "border-l-alert",
          toast.type === "info" && "border-l-clay",
        )}
      >
        <p className="font-body text-sm text-ink2">{toast.message}</p>
      </Card>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
