import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markAllRead } from "../redux/notificationSlice.js";
import { timeAgo } from "../components/Layout.jsx";
import EmptyState from "../components/EmptyState.jsx";

const typeStyles = {
    dose_missed: { icon: "🚨", tone: "border-rose-200 bg-rose-50/60" },
    refill_low: { icon: "📦", tone: "border-amber-200 bg-amber-50/60" },
    weekly_digest: { icon: "📊", tone: "border-brand-200 bg-brand-50/60" },
    member_added: { icon: "👋", tone: "border-sky-200 bg-sky-50/50" },
    med_added: { icon: "💊", tone: "border-brand-200 bg-brand-50/60" },
    system: { icon: "ℹ️", tone: "border-stone-100 bg-white" },
};

export default function Notifications() {
    const dispatch = useDispatch();
    const { items, status } = useSelector((s) => s.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Notifications</h1>
                    <p className="mt-1 text-sm text-stone-500">Escalations, refill alerts and weekly digests for your family.</p>
                </div>
                {items.some((n) => !n.isRead) && (
                    <button onClick={() => dispatch(markAllRead())}
                        className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-stone-400">
                        Mark all as read
                    </button>
                )}
            </div>

            {status === "idle" && items.length === 0 && <div className="h-64 animate-pulse rounded-3xl bg-stone-100" />}

            {items.length === 0 && status !== "idle" && (
                <EmptyState emoji="🔔" title="All quiet" body="When a dose is missed or stock runs low, you'll hear about it here first." />
            )}

            <div className="space-y-2.5">
                {items.map((n) => {
                    const style = typeStyles[n.type] || typeStyles.system;
                    return (
                        <div key={n._id} className={`flex gap-4 rounded-2xl border p-4 shadow-card ${style.tone} ${!n.isRead ? "ring-1 ring-brand-200" : ""}`}>
                            <span className="text-2xl">{style.icon}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold">{n.title}</p>
                                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                                </div>
                                <p className="mt-1 whitespace-pre-line text-sm text-stone-600">{n.body}</p>
                                <p className="mt-1.5 text-xs text-stone-400">{timeAgo(n.createdAt)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
