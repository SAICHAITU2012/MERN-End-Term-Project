import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchToday } from "../redux/scheduleSlice.js";
import { fetchNotifications, markAllRead } from "../redux/notificationSlice.js";
import Avatar from "./Avatar.jsx";
import {
    PillIcon, BellIcon, HomeIcon, UsersIcon, ChartIcon, SettingsIcon,
    ClipboardIcon, LogoutIcon, MenuIcon, XIcon, HeartIcon,
} from "./icons.jsx";

// caregiver shell: sidebar on desktop, top bar + drawer on mobile.
// Owns the two polling loops (schedule 30s, notifications 45s) so every
// screen shows live data — and fires browser notifications for due doses.
export default function Layout() {
    const { user, family, logout } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const unread = useSelector((s) => s.notifications.unreadCount);
    const doses = useSelector((s) => s.schedule.doses);
    const [drawer, setDrawer] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchToday());
        dispatch(fetchNotifications());
        const a = setInterval(() => dispatch(fetchToday()), 30000);
        const b = setInterval(() => dispatch(fetchNotifications()), 45000);
        return () => { clearInterval(a); clearInterval(b); };
    }, [dispatch]);

    // browser notifications for doses that just became due
    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        const now = Date.now();
        for (const dose of doses) {
            if (dose.status !== "pending") continue;
            const dueAt = new Date(dose.scheduledFor).getTime();
            if (now - dueAt > 5 * 60000 || dueAt - now > 20000) continue;
            const key = `notified-${dose._id}-${dose.snoozeCount}`;
            if (localStorage.getItem(key)) continue;
            localStorage.setItem(key, "1");
            const med = dose.medication?.name || "Medication";
            new Notification(`${dose.member?.name}: ${med} at ${dose.timeLabel}`, {
                body: dose.medication?.instructions || "Time to take this dose.",
                tag: dose._id,
            });
        }
    }, [doses]);

    const nav = [
        { to: "/dashboard", label: "Today", icon: HomeIcon },
        { to: "/medications", label: "Medications", icon: PillIcon },
        { to: "/reports", label: "Reports", icon: ChartIcon },
        { to: "/settings", label: "Settings", icon: SettingsIcon },
    ];

    const doLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-paper">
            {/* top bar */}
            <header className="no-print sticky top-0 z-40 border-b border-stone-200/70 bg-paper/85 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
                    <button className="rounded-lg p-2 hover:bg-stone-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
                        <MenuIcon />
                    </button>
                    <NavLink to="/dashboard" className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
                            <PillIcon size={17} />
                        </span>
                        <span className="text-lg font-extrabold tracking-tight">MedMate</span>
                    </NavLink>
                    <span className="ml-2 hidden rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500 sm:block">
                        {family?.name}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setBellOpen((v) => !v);
                                    if (!bellOpen && unread) dispatch(markAllRead());
                                }}
                                className="relative rounded-xl p-2.5 hover:bg-stone-100"
                                aria-label="Notifications"
                            >
                                <BellIcon size={19} />
                                {unread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>
                            {bellOpen && <NotificationPanel onClose={() => setBellOpen(false)} />}
                        </div>
                        <NavLink to="/settings" className="rounded-full transition hover:opacity-85">
                            <Avatar name={user.name} src={user.avatar} size={36} />
                        </NavLink>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl">
                {/* sidebar (desktop) */}
                <aside className="no-print sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col justify-between border-r border-stone-200/70 px-3 py-6 lg:flex">
                    <nav className="flex flex-col gap-1">
                        {nav.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        isActive ? "bg-brand-600 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"
                                    }`
                                }
                            >
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </nav>
                    <button onClick={doLogout} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-500 transition hover:bg-rose-50 hover:text-rose-600">
                        <LogoutIcon size={18} /> Log out
                    </button>
                </aside>

                {/* mobile drawer */}
                {drawer && (
                    <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
                        <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
                        <div className="animate-rise absolute left-0 top-0 h-full w-64 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2 font-extrabold">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white"><PillIcon size={17} /></span>
                                    MedMate
                                </span>
                                <button onClick={() => setDrawer(false)} className="p-1"><XIcon /></button>
                            </div>
                            <nav className="flex flex-col gap-1">
                                {nav.map(({ to, label, icon: Icon }) => (
                                    <NavLink key={to} to={to} onClick={() => setDrawer(false)}
                                        className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "bg-brand-600 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                                        <Icon size={18} /> {label}
                                    </NavLink>
                                ))}
                                <button onClick={doLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                                    <LogoutIcon size={18} /> Log out
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
                    <Outlet />
                </main>
            </div>

            <footer className="no-print py-8 text-center text-xs text-stone-400">
                <span className="inline-flex items-center gap-1.5">
                    Built with <HeartIcon size={12} className="text-rose-400" /> — MedMate, so no dose is silently missed
                </span>
            </footer>
        </div>
    );
}

function NotificationPanel({ onClose }) {
    const items = useSelector((s) => s.notifications.items).slice(0, 12);
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="animate-rise absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-pop sm:w-96">
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                    <p className="text-sm font-bold">Notifications</p>
                    <button onClick={onClose} className="text-stone-400 hover:text-ink"><XIcon size={16} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {items.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-stone-400">You're all caught up 🎉</p>
                    )}
                    {items.map((n) => (
                        <NotificationRow key={n._id} n={n} />
                    ))}
                </div>
                <button
                    onClick={() => { onClose(); }}
                    className="w-full border-t border-stone-100 py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                    View all
                </button>
            </div>
        </>
    );
}

const typeStyles = {
    dose_missed: { dot: "bg-rose-500", icon: "🚨" },
    refill_low: { dot: "bg-amber-500", icon: "📦" },
    weekly_digest: { dot: "bg-brand-500", icon: "📊" },
    member_added: { dot: "bg-sky-500", icon: "👋" },
    med_added: { dot: "bg-brand-500", icon: "💊" },
    system: { dot: "bg-stone-400", icon: "ℹ️" },
    dose_due: { dot: "bg-amber-400", icon: "⏰" },
};

function NotificationRow({ n }) {
    const style = typeStyles[n.type] || typeStyles.system;
    return (
        <div className={`flex gap-3 border-b border-stone-50 px-4 py-3 ${!n.isRead ? "bg-brand-50/40" : ""}`}>
            <span className="mt-0.5 text-lg leading-none">{style.icon}</span>
            <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${n.isRead ? "font-medium text-stone-600" : "font-bold"}`}>{n.title}</p>
                <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-xs text-stone-500">{n.body}</p>
                <p className="mt-1 text-[11px] text-stone-400">{timeAgo(n.createdAt)}</p>
            </div>
        </div>
    );
}

export const timeAgo = (iso) => {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};
