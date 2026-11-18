"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";

/** Diálogo nativo (<dialog>): foco preso, Esc fecha e clique fora fecha. Abra com dialogRef.current?.showModal(). */
export function Dialog({ dialogRef, title, children, onClose, closeLabel = "Fechar", maxWidth = "max-w-xl" }: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  maxWidth?: string;
}) {
  const titleId = useId();
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={titleId}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
      }}
      className={`overview-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${maxWidth} overflow-auto rounded-2xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-white p-5">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label={closeLabel} className="rounded-xl p-2 text-ink-soft hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand-600">
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
