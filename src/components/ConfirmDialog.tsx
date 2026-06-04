interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine/55 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border-2 border-pine/10 bg-butter-light p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-pine">{title}</h2>
        <p className="mt-3 text-sm font-bold leading-relaxed text-pine/65">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-pine/20 px-4 py-3 font-bold text-pine transition-colors hover:bg-pine/5 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 font-bold text-butter shadow-md transition-colors disabled:opacity-60 ${
              danger ? 'bg-[#8a2222] hover:bg-[#6f1b1b]' : 'bg-pine hover:bg-pine-light'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
