'use client'

import { useState, useEffect } from 'react'

interface TypingTitleProps {
  texts: string[]
  prefix?: string
  suffix?: string
  className?: string
}

export default function TypingTitle({
  texts,
  prefix = '',
  suffix = '',
  className,
}: TypingTitleProps) {
  const [currentText, setCurrentText] = useState(texts[0] || '')
  const [loopNum, setLoopNum] = useState(0)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const targetText = texts[loopNum % texts.length]

    if (currentText === targetText) {
      timeout = setTimeout(() => {
        setLoopNum((prev) => prev + 1)
      }, 2000)
      return () => clearTimeout(timeout)
    }

    const isTyping = targetText.startsWith(currentText)

    if (isTyping) {
      timeout = setTimeout(() => {
        setCurrentText(targetText.slice(0, currentText.length + 1))
      }, 150)
    } else {
      timeout = setTimeout(() => {
        setCurrentText(currentText.slice(0, currentText.length - 1))
      }, 50)
    }

    return () => clearTimeout(timeout)
  }, [currentText, loopNum, texts])

  return (
    <div className={className}>
      <span>{prefix}</span>
      <span>{currentText}</span>
      <span>{suffix}</span>
    </div>
  )
}
