'use client'

import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ActionDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmTone?: 'default' | 'danger'
  busy?: boolean
  onConfirm?: () => void
  onClose: () => void
  children?: ReactNode
}

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'default',
  busy = false,
  onConfirm,
  onClose,
  children,
}: ActionDialogProps) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#e7dacd] bg-[#fffaf4] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-[#1f1711]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[#6f6258]">{description}</p>}
        {children && <div className="mt-3">{children}</div>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#dbcab7] px-3 py-2 text-sm text-[#4d3f34]">
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all duration-150 ${confirmTone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1f1711] hover:bg-[#352821]'} ${busy ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-[1px]'}`}
            >
              {busy ? 'Please wait…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
