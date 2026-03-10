"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MessageBoxVariant = "info" | "success" | "error" | "warning";

export interface MessageBoxProps {
  open: boolean;
  title: string;
  message: string;
  variant?: MessageBoxVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

const STYLE_MAP: Record<MessageBoxVariant, { icon: ReactNode; accent: string }> = {
  info: {
    icon: <Info size={18} />,
    accent: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  },
  success: {
    icon: <CheckCircle2 size={18} />,
    accent: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  },
  error: {
    icon: <AlertCircle size={18} />,
    accent: "text-rose-300 border-rose-500/30 bg-rose-500/10",
  },
  warning: {
    icon: <TriangleAlert size={18} />,
    accent: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  },
};

export function MessageBox({
  open,
  title,
  message,
  variant = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}: MessageBoxProps) {
  if (!open) return null;

  const style = STYLE_MAP[variant];
  const isConfirm = typeof onConfirm === "function";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1222] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg border p-2 ${style.accent}`}>{style.icon}</div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isConfirm && (
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              {cancelText}
            </Button>
          )}
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={() => {
              if (isConfirm && onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
