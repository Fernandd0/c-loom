import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const LEGAL_UPDATED = 'October 25, 2026'
export const CONTACT_URL = 'https://fernandojs.com'

// Shared frame for the privacy policy and terms: a calm, readable document page.
export function LegalPage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-10 sm:py-16">
      <article className="mx-auto max-w-2xl rounded-3xl bg-white px-6 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.04)] sm:px-12 sm:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-0.5 text-[14px] font-medium text-[#007AFF] hover:underline"
        >
          <ChevronLeft size={16} />
          C-LOOM
        </Link>
        <h1 className="text-4xl leading-tight font-medium text-[#1C1C1E] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-[#8E8E93]">
          Last updated {LEGAL_UPDATED}
        </p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-[#3C3C43] [&_a]:font-medium [&_a]:text-[#007AFF] [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:font-sans [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-[#1C1C1E] [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul+p]:mt-3">
          {children}
        </div>
      </article>
      <LegalFooter className="mt-8" />
    </div>
  )
}

export function LegalFooter({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Legal"
      className={`flex justify-center gap-4 text-[12px] text-[#86868b] ${className ?? ''}`}
    >
      <Link href="/privacy" className="hover:text-[#1C1C1E]">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-[#1C1C1E]">
        Terms
      </Link>
    </nav>
  )
}
