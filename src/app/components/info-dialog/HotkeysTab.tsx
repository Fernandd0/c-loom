'use client'

import { Kbd } from '../Kbd'

export function HotkeysTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
      <h2 className="text-center text-2xl font-bold tracking-tight text-[#1C1C1E]">
        Keyboard Shortcuts
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-sm font-medium text-[#1C1C1E]">New Task</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <span className="text-xs text-[#8E8E93]">+</span>
            <Kbd>Enter</Kbd>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-sm font-medium text-[#1C1C1E]">Open Guide</span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <span className="text-xs text-[#8E8E93]">+</span>
            <Kbd>G</Kbd>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-sm font-medium text-[#1C1C1E]">
            Open Shortcuts
          </span>
          <div className="flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <span className="text-xs text-[#8E8E93]">+</span>
            <Kbd>K</Kbd>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-sm font-medium text-[#1C1C1E]">
            Delete Task
          </span>
          <span className="text-xs font-semibold text-[#8E8E93]">
            Double Click
          </span>
        </div>
      </div>
    </div>
  )
}
