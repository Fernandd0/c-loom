import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { GeistPixelCircle } from 'geist/font/pixel'
import { Caveat } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { env } from '@/lib/env'
import { THEME_SCRIPT } from '@/lib/theme'
import { ThemeSync } from './hooks/useTheme'

// Handwriting for the first-run hints on an empty board.
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-caveat',
})

export const metadata: Metadata = {
  title: 'C-LOOM',
  description:
    'A visual task board where every task is a circle that grows the longer it waits.',
  ...(env.googleSiteVerification && {
    verification: { google: env.googleSiteVerification },
  }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // data-theme is set before hydration by THEME_SCRIPT, so React mustn't warn about it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelCircle.variable} ${caveat.variable} antialiased`}
      >
        {children}
        <ThemeSync />
        <Analytics />
      </body>
    </html>
  )
}
