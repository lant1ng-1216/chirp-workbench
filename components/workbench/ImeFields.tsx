'use client'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

/**
 * Controlled field with IME-safe buffering.
 * During pinyin composition we update local draft only; parent syncs on composition end.
 * Blocking onChange without a local draft makes typing impossible (controlled value snaps back).
 */
export function ImeTextarea({
  value,
  onValueChange,
  style,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  value: string
  onValueChange: (v: string) => void
  style?: CSSProperties
}) {
  const composing = useRef(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!composing.current) setDraft(value)
  }, [value])

  return (
    <textarea
      {...rest}
      value={draft}
      style={style}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={(e: CompositionEvent<HTMLTextAreaElement>) => {
        composing.current = false
        const next = e.currentTarget.value
        setDraft(next)
        onValueChange(next)
      }}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        const next = e.target.value
        setDraft(next)
        if (!composing.current) onValueChange(next)
      }}
    />
  )
}

export function ImeInput({
  value,
  onValueChange,
  style,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onValueChange: (v: string) => void
  style?: CSSProperties
}) {
  const composing = useRef(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!composing.current) setDraft(value)
  }, [value])

  return (
    <input
      {...rest}
      value={draft}
      style={style}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={(e: CompositionEvent<HTMLInputElement>) => {
        composing.current = false
        const next = e.currentTarget.value
        setDraft(next)
        onValueChange(next)
      }}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value
        setDraft(next)
        if (!composing.current) onValueChange(next)
      }}
    />
  )
}
