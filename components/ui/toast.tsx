'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 right-0 z-[9999] flex max-h-screen w-full flex-col p-4 sm:top-4 sm:right-4 sm:bottom-auto md:max-w-[460px]',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-5 pr-8 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
  {
    variants: {
      variant: {
        default: 'border-zinc-200 bg-white text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50',
        destructive:
          'destructive border-red-400/40 bg-red-600 text-white dark:border-red-400/30 dark:bg-red-600',
        success:
          'success border-emerald-400/40 bg-emerald-600 text-white dark:border-emerald-400/30 dark:bg-emerald-600',
        warning:
          'warning border-amber-300/40 bg-amber-500 text-amber-950 dark:border-amber-400/30 dark:bg-amber-600 dark:text-white',
        info:
          'info border-blue-400/40 bg-blue-600 text-white dark:border-blue-400/30 dark:bg-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      'border-zinc-200 bg-transparent hover:bg-zinc-100 focus:ring-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:focus:ring-zinc-800',
      'group-[.destructive]:border-white/20 group-[.destructive]:text-white group-[.destructive]:hover:border-transparent group-[.destructive]:hover:bg-red-500 group-[.destructive]:focus:ring-red-300',
      'group-[.success]:border-white/20 group-[.success]:text-white group-[.success]:hover:border-transparent group-[.success]:hover:bg-emerald-500 group-[.success]:focus:ring-emerald-300',
      'group-[.warning]:border-amber-700/20 group-[.warning]:hover:bg-amber-400 group-[.warning]:focus:ring-amber-300 dark:group-[.warning]:border-white/20 dark:group-[.warning]:text-white dark:group-[.warning]:hover:bg-amber-500',
      'group-[.info]:border-white/20 group-[.info]:text-white group-[.info]:hover:border-transparent group-[.info]:hover:bg-blue-500 group-[.info]:focus:ring-blue-300',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50',
      'group-[.destructive]:text-red-200 group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-red-300',
      'group-[.success]:text-emerald-200 group-[.success]:hover:text-white group-[.success]:focus:ring-emerald-300',
      'group-[.warning]:text-amber-800 group-[.warning]:hover:text-amber-950 group-[.warning]:focus:ring-amber-300 dark:group-[.warning]:text-amber-200 dark:group-[.warning]:hover:text-white',
      'group-[.info]:text-blue-200 group-[.info]:hover:text-white group-[.info]:focus:ring-blue-300',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      'text-sm',
      'text-zinc-600 dark:text-zinc-400',
      'group-[.destructive]:text-red-100',
      'group-[.success]:text-emerald-100',
      'group-[.warning]:text-amber-900 dark:group-[.warning]:text-amber-100',
      'group-[.info]:text-blue-100',
      className,
    )}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
