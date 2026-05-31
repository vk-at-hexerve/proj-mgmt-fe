'use client';

import { useApp } from '@/lib/app-context';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-600 dark:bg-emerald-600',
    border: 'border-emerald-400/40 dark:border-emerald-400/30',
    text: 'text-white',
    descText: 'text-emerald-100',
    closeBtn: 'text-emerald-200 hover:text-white focus:ring-emerald-300',
    iconColor: 'text-white',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-600 dark:bg-red-600',
    border: 'border-red-400/40 dark:border-red-400/30',
    text: 'text-white',
    descText: 'text-red-100',
    closeBtn: 'text-red-200 hover:text-white focus:ring-red-300',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500 dark:bg-amber-600',
    border: 'border-amber-300/40 dark:border-amber-400/30',
    text: 'text-amber-950 dark:text-white',
    descText: 'text-amber-900 dark:text-amber-100',
    closeBtn: 'text-amber-800 hover:text-amber-950 dark:text-amber-200 dark:hover:text-white focus:ring-amber-300',
    iconColor: 'text-amber-950 dark:text-white',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-600 dark:bg-blue-600',
    border: 'border-blue-400/40 dark:border-blue-400/30',
    text: 'text-white',
    descText: 'text-blue-100',
    closeBtn: 'text-blue-200 hover:text-white focus:ring-blue-300',
    iconColor: 'text-white',
  },
};

export function AppToasts() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const IconComponent = config.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl',
              'animate-in slide-in-from-right-5 fade-in-0 duration-300',
              'hover:shadow-3xl transition-shadow',
              config.bg,
              config.border,
            )}
          >
            <div className="shrink-0 mt-0.5">
              <IconComponent className={cn('size-5', config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-semibold text-sm leading-tight', config.text)}>
                {toast.title}
              </p>
              {toast.description && (
                <p className={cn('text-sm mt-1 leading-snug', config.descText)}>
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className={cn(
                'shrink-0 rounded-md p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
                config.closeBtn,
              )}
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
