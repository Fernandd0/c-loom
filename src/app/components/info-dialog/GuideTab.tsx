'use client'

import { AlertOctagon } from 'lucide-react'

export function GuideTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
          How C-LOOM Works
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#3C3C43]">
          Visual task management that grows with urgency
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-b from-white to-[#FAFAFA] p-4">
        <p className="text-center text-sm leading-relaxed text-[#1C1C1E]">
          Tasks{' '}
          <span className="font-semibold text-[#1C1C1E]">grow larger</span> as
          deadlines approach.
          <br />
          Complete them before they{' '}
          <span className="font-semibold text-[#1C1C1E]">
            take over your screen
          </span>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-br from-[#FFE6E6] to-[#FFD6D6] p-4">
        <div className="mb-2 flex justify-center">
          <div className="rounded-full bg-rose-100 p-2">
            <AlertOctagon className="h-5 w-5 text-rose-600" />
          </div>
        </div>
        <p className="text-center text-xs font-semibold text-rose-900">
          Urgent Alert
        </p>
        <p className="mt-1 text-center text-[10px] text-rose-700">
          Shows when deadline is within 24 hours
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="text-center text-xs font-semibold text-[#1C1C1E]">
          Key Features
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">📁</span>
            <span className="text-[#3C3C43]">Multiple workspaces</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">🏷️</span>
            <span className="text-[#3C3C43]">Custom categories</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">⚡</span>
            <span className="text-[#3C3C43]">Priority levels 0-10</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">🔄</span>
            <span className="text-[#3C3C43]">Recurring tasks</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">☁️</span>
            <span className="text-[#3C3C43]">Cloud sync with Supabase</span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#F9F9F9] px-3 py-2">
            <span className="mt-0.5 text-[#8E8E93]">✨</span>
            <span className="text-[#3C3C43]">
              Free <span className="text-[#8E8E93]">(for now)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
