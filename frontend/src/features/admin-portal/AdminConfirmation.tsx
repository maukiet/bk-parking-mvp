import type { ReactNode } from 'react'

export function AdminConfirmation({ title, children, confirmLabel, busy, onCancel, onConfirm }: {
  title: string
  children: ReactNode
  confirmLabel: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <section aria-label={title} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="text-sm text-slate-600">{children}</div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
          Quay lại
        </button>
        <button type="button" disabled={busy} onClick={onConfirm} className="min-h-11 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </section>
  )
}
