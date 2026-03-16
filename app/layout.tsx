import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProvider } from '@/lib/app-context'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AppModals } from '@/components/modals/app-modals'
import { AppToasts } from '@/components/ui/app-toasts'
import { CommandPalette } from '@/components/command-palette'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Nexus PM - Agentic AI Project Management',
  description: 'Enterprise-grade Project, Program, and Portfolio Management platform with autonomous AI planning, risk detection, and execution assistance.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AppProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <AppModals />
          <AppToasts />
          <CommandPalette />
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
