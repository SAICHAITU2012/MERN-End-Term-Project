import { XIcon } from "./icons.jsx";

export default function Modal({ open, onClose, title, children, wide = false }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
            <div
                className={`animate-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-pop sm:rounded-3xl ${
                    wide ? "sm:max-w-2xl" : "sm:max-w-md"
                }`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink" aria-label="Close">
                        <XIcon size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
