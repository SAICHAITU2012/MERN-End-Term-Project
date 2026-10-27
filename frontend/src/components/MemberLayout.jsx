import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import { fetchNotifications } from "../redux/notificationSlice.js";

const links = [
    ["/my-meds", "Today", "☀️", true],
    ["/my-meds/medicines", "My medicines", "💊"],
    ["/my-meds/history", "Dose history", "🗓️"],
    ["/my-meds/progress", "My progress", "📈"],
    ["/my-meds/alerts", "Alerts", "🔔"],
];

export default function MemberLayout() {
    const { user, family, logout } = useAuth();
    const dispatch = useDispatch();
    const unread = useSelector((state) => state.notifications.unreadCount);
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchNotifications());
        const timer = setInterval(() => dispatch(fetchNotifications()), 45000);
        return () => clearInterval(timer);
    }, [dispatch]);

    const signOut = async () => {
        if (busy) return;
        setBusy(true);
        try { await logout(); } finally { navigate("/login", { replace: true }); }
    };

    return (
        <div className="min-h-screen bg-[#f6f8f7] text-ink">
            <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-xl text-white shadow-pop">✚</span>
                    <div className="min-w-0 flex-1">
                        <p className="font-display font-extrabold leading-tight">MedMate</p>
                        <p className="truncate text-[11px] font-semibold text-stone-500">{family?.name || "Your care circle"}</p>
                    </div>
                    <NavLink to="/my-meds/alerts" className="relative rounded-xl p-2.5 text-xl hover:bg-stone-100" aria-label={`Alerts${unread ? `, ${unread} unread` : ""}`}>
                        🔔{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white">{unread > 9 ? "9+" : unread}</span>}
                    </NavLink>
                    <button onClick={signOut} disabled={busy} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-extrabold text-stone-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60" aria-label="Log out">
                        {busy ? "Signing out…" : <><span className="mr-1" aria-hidden="true">↗</span>Log out</>}
                    </button>
                    <button className="rounded-xl p-2 text-xl hover:bg-stone-100 md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Open member navigation">☰</button>
                    <div className="hidden sm:block"><Avatar name={user?.name || "Me"} src={user?.avatar} size={38} ring /></div>
                </div>
                <nav className="mx-auto hidden max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:flex sm:px-6" aria-label="Member navigation">
                    {links.map(([to, label, icon, end]) => <MemberNav key={to} to={to} label={label} icon={icon} end={end} unread={unread} />)}
                </nav>
                {menuOpen && <nav className="grid grid-cols-2 gap-2 border-t border-stone-100 p-3 md:hidden" aria-label="Member navigation">
                    {links.map(([to, label, icon, end]) => <MemberNav key={to} to={to} label={label} icon={icon} end={end} unread={unread} onClick={() => setMenuOpen(false)} />)}
                </nav>}
            </header>
            <main className="mx-auto max-w-6xl px-4 py-6 pb-10 sm:px-6 sm:py-8"><Outlet /></main>
            <footer className="px-4 pb-24 text-center text-xs font-semibold text-stone-400 md:pb-8">Your care circle can see your dose status · MedMate</footer>
            <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-stone-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden" aria-label="Quick navigation">
                {links.map(([to, label, icon, end]) => <MemberNav key={to} to={to} label={label} icon={icon} end={end} unread={unread} compact />)}
            </nav>
        </div>
    );
}

function MemberNav({ to, label, icon, end, unread, compact = false, onClick }) {
    return <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `relative flex shrink-0 items-center justify-center gap-2 rounded-xl font-extrabold transition ${compact ? "min-h-14 flex-col gap-0.5 px-1 text-[9px]" : "px-4 py-2.5 text-sm"} ${isActive ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100" : "text-stone-500 hover:bg-stone-50 hover:text-ink"}`}>
        <span className={compact ? "text-lg leading-none" : "text-base"} aria-hidden="true">{icon}</span>{!compact && label}{compact && <span className="max-w-full truncate">{label === "My medicines" ? "Medicines" : label === "Dose history" ? "History" : label === "My progress" ? "Progress" : label}</span>}
        {to.endsWith("alerts") && unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
    </NavLink>;
}
