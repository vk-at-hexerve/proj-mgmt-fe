'use client';

import { useApp } from '@/lib/app-context';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastIcons = {
  success: <CheckCircle2 className="size-5 text-success" />,
  error: <AlertCircle className="size-5 text-destructive" />,
  warning: <AlertTriangle className="size-5 text-warning" />,
  info: <Info className="size-5 text-accent" />,
};

const toastStyles = {
  success: 'border-success/30 bg-success/5',
  error: 'border-destructive/30 bg-destructive/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-accent/30 bg-accent/5',
};

export function AppToasts() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-4 p-5 rounded-xl border shadow-xl bg-card animate-in slide-in-from-right-5',
            toastStyles[toast.type]
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="size-6 text-success" />}
            {toast.type === 'error' && <AlertCircle className="size-6 text-destructive" />}
            {toast.type === 'warning' && <AlertTriangle className="size-6 text-warning" />}
            {toast.type === 'info' && <Info className="size-6 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base">{toast.title}</p>
            {toast.description && (
              <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="size-5" />
          </button>
        </div>
      ))}
    </div>
  );
}
