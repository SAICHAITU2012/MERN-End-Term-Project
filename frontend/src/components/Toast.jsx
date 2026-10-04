import { createContext, useCallback, useContext, useState } from "react";
import { CheckIcon, AlertIcon, XIcon } from "./icons.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, kind = "success") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((t) => [...t, { id, message, kind }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    }, []);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`animate-rise pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-pop ${
                            t.kind === "error" ? "bg-rose-600" : "bg-ink"
                        }`}
                    >
                        {t.kind === "error" ? <AlertIcon size={18} className="mt-0.5 shrink-0" /> : <CheckIcon size={18} className="mt-0.5 shrink-0" />}
                        <span className="flex-1">{t.message}</span>
                        <button
                            onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                            className="opacity-60 transition hover:opacity-100"
                            aria-label="Dismiss"
                        >
                            <XIcon size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
