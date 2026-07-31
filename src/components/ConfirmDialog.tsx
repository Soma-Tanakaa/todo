"use client";

export function ConfirmDialog({
  open,
  title,
  message,
  okLabel = "OK",
  danger,
  onOk,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  okLabel?: string;
  danger?: boolean;
  onOk: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs rounded-xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[15px] font-semibold">{title}</p>
        {message && (
          <p className="mt-2 text-sm whitespace-pre-wrap text-gray-600">{message}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-gray-600 active:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            onClick={onOk}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              danger ? "bg-red-600" : "bg-gray-900"
            } active:opacity-80`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
