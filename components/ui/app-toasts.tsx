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
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-card animate-in slide-in-from-left-5',
            toastStyles[toast.type]
          )}
        >
          {toastIcons[toast.type]}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
