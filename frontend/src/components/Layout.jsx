import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchToday } from "../redux/scheduleSlice.js";
import { fetchNotifications, markAllRead } from "../redux/notificationSlice.js";
import Avatar from "./Avatar.jsx";
import {
    PillIcon, BellIcon, HomeIcon, ChartIcon, SettingsIcon,
    LogoutIcon, MenuIcon, XIcon,
} from "./icons.jsx";

// caregiver shell: dark glass sidebar on desktop, top bar + drawer on mobile.
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
        { to: "/dashboard", label: "Today", icon: HomeIcon, hue: "from-brand-400 to-emerald-400" },
        { to: "/medications", label: "Medications", icon: PillIcon, hue: "from-violet-400 to-fuchsia-400" },
        { to: "/reports", label: "Reports", icon: ChartIcon, hue: "from-amber-400 to-orange-400" },
        { to: "/settings", label: "Settings", icon: SettingsIcon, hue: "from-sky-400 to-cyan-400" },
    ];

    const doLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-paper">
            {/* top bar */}
            <header className="no-print sticky top-0 z-40 border-b border-white/60 glass">
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
                    <button className="rounded-lg p-2 hover:bg-white/60 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
                        <MenuIcon />
                    </button>
                    <NavLink to="/dashboard" className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-pop">
                            <PillIcon size={18} />
                        </span>
                        <span className="font-display text-lg font-extrabold tracking-tight">MedMate</span>
                    </NavLink>
                    <span className="ml-2 hidden rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-stone-500 ring-1 ring-ink/5 sm:block">
                        {family?.name}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={doLogout} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-extrabold text-stone-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:px-3.5 sm:text-sm" aria-label="Log out">
                            <span aria-hidden="true">↗</span><span className="ml-1">Log out</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setBellOpen((v) => !v);
                                    if (!bellOpen && unread) dispatch(markAllRead());
                                }}
                                className="relative rounded-xl p-2.5 transition hover:bg-white/70"
                                aria-label="Notifications"
                            >
                                <BellIcon size={19} />
                                {unread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow-sm">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>
                            {bellOpen && <NotificationPanel onClose={() => setBellOpen(false)} />}
                        </div>
                        <NavLink to="/settings" className="rounded-full transition hover:opacity-85">
                            <Avatar name={user.name} src={user.avatar} size={38} ring />
                        </NavLink>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl">
                {/* sidebar (desktop) */}
                <aside className="no-print sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between px-3 py-6 lg:flex">
                    <nav className="flex flex-col gap-1.5">
                        {nav.map(({ to, label, icon: Icon, hue }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                                        isActive
                                            ? "bg-ink text-white shadow-pop"
                                            : "text-stone-500 hover:bg-white/70 hover:text-ink"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                                            isActive ? `bg-gradient-to-br ${hue} text-white` : "bg-stone-100 text-stone-400 group-hover:text-ink"
                                        }`}>
                                            <Icon size={16} />
                                        </span>
                                        {label}
                                        {isActive && <span className={`absolute right-3 h-1.5 w-1.5 rounded-full bg-gradient-to-r ${hue}`} />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                    <button onClick={doLogout} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-stone-400 transition hover:bg-rose-50 hover:text-rose-600">
                        <LogoutIcon size={18} /> Log out
                    </button>
                </aside>

                {/* mobile drawer */}
                {drawer && (
                    <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
                        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
                        <div className="animate-rise absolute left-0 top-0 h-full w-64 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-6 flex items-center justify-between">
                                <span className="flex items-center gap-2 font-extrabold">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white"><PillIcon size={16} /></span>
                                    MedMate
                                </span>
                                <button onClick={() => setDrawer(false)} className="p-1"><XIcon /></button>
                            </div>
                            <nav className="flex flex-col gap-1">
                                {nav.map(({ to, label, icon: Icon }) => (
                                    <NavLink key={to} to={to} onClick={() => setDrawer(false)}
                                        className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${isActive ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                                        <Icon size={17} /> {label}
                                    </NavLink>
                                ))}
                                <button onClick={doLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50">
                                    <LogoutIcon size={17} /> Log out
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-10">
                    <Outlet />
                </main>
            </div>

            <footer className="no-print py-8 text-center text-xs font-semibold text-stone-400">
                MedMate · so no dose is silently missed
            </footer>
        </div>
    );
}

function NotificationPanel({ onClose }) {
    const items = useSelector((s) => s.notifications.items).slice(0, 12);
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="animate-rise absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-pop backdrop-blur-xl sm:w-96">
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                    <p className="text-sm font-extrabold">Notifications</p>
                    <button onClick={onClose} className="text-stone-400 hover:text-ink"><XIcon size={16} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {items.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-stone-400">You're all caught up 🎉</p>
                    )}
                    {items.map((n) => <NotificationRow key={n._id} n={n} />)}
                </div>
            </div>
        </>
    );
}

const typeStyles = {
    dose_missed: { icon: "🚨" },
    refill_low: { icon: "📦" },
    weekly_digest: { icon: "📊" },
    member_added: { icon: "👋" },
    med_added: { icon: "💊" },
    system: { icon: "ℹ️" },
    dose_due: { icon: "⏰" },
};

function NotificationRow({ n }) {
    const style = typeStyles[n.type] || typeStyles.system;
    return (
        <div className={`flex gap-3 border-b border-stone-50 px-4 py-3 ${!n.isRead ? "bg-brand-50/50" : ""}`}>
            <span className="mt-0.5 text-lg leading-none">{style.icon}</span>
            <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${n.isRead ? "font-semibold text-stone-600" : "font-extrabold"}`}>{n.title}</p>
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
