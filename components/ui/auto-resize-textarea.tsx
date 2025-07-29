import React, { useEffect, useRef } from 'react'

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

export function AutoResizeTextarea({ 
  minRows = 2, 
  maxRows = 10, 
  value,
  onChange,
  className,
  ...props 
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to recalculate
    textarea.style.height = 'auto'
    
    // Calculate the height
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
    const minHeight = minRows * lineHeight
    const maxHeight = maxRows * lineHeight
    const scrollHeight = textarea.scrollHeight

    // Set the height
    if (scrollHeight < minHeight) {
      textarea.style.height = `${minHeight}px`
    } else if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = 'auto'
    } else {
      textarea.style.height = `${scrollHeight}px`
      textarea.style.overflowY = 'hidden'
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e)
    }
    adjustHeight()
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={`${className} resize-none transition-height duration-150`}
      style={{ overflow: 'hidden' }}
      {...props}
    />
  )
}