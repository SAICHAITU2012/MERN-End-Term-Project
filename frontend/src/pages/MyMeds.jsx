import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchToday } from "../redux/scheduleSlice.js";
import { useAuth } from "../context/AuthContext.jsx";
import ThreeBackground from "../components/ThreeBackground.jsx";
import DoseCard from "../components/DoseCard.jsx";
import Avatar from "../components/Avatar.jsx";

// Member self-view: a calm, premium, extra-large experience —
// designed to be usable by a 70-year-old on a phone.
export default function MyMeds() {
    const dispatch = useDispatch();
    const { doses, todayLabel, status, error } = useSelector((s) => s.schedule);
    const { user, family } = useAuth();

    useEffect(() => {
        dispatch(fetchToday());
        const t = setInterval(() => dispatch(fetchToday()), 30000);
        return () => clearInterval(t);
    }, [dispatch]);

    // browser notifications for this member's due doses
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        const now = Date.now();
        for (const dose of doses) {
            if (dose.status !== "pending") continue;
            const dueAt = new Date(dose.scheduledFor).getTime();
            if (now - dueAt > 5 * 60000 || dueAt - now > 20000) continue;
            const key = `notified-${dose._id}-${dose.snoozeCount}`;
            if (localStorage.getItem(key)) continue;
            localStorage.setItem(key, "1");
            new Notification(`${dose.medication?.name || "Medication"} — ${dose.timeLabel}`, {
                body: dose.medication?.instructions || "Time to take your dose 💊",
                tag: dose._id,
            });
        }
    }, [doses]);

    // the API already scopes member accounts to their own doses
    const mine = doses;
    const pending = mine.filter((d) => d.status === "pending");
    const others = mine.filter((d) => d.status !== "pending");
    const handled = mine.length - pending.length;
    const progress = mine.length ? Math.round((handled / mine.length) * 100) : 0;

    return (
        <div className="aurora relative min-h-screen overflow-hidden bg-brand-950 pb-20">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 via-brand-900/60 to-ink/80" />
            <ThreeBackground density={18} className="opacity-70" />

            <header className="relative mx-auto max-w-xl px-5 pt-14 text-center text-white">
                <div className="animate-pop mx-auto mb-5 w-fit rounded-full bg-gradient-to-br from-brand-400 to-emerald-400 p-1.5 shadow-glow">
                    <Avatar name={user?.name || "Me"} src={user?.avatar} size={84} ring />
                </div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight">
                    Hello, {user?.name?.split(" ")[0] || "there"} 👋
                </h1>
                <p className="mt-2 font-semibold text-brand-100/90">
                    {todayLabel
                        ? new Date(`${todayLabel}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
                        : ""}
                </p>

                {/* daily progress bar */}
                {mine.length > 0 && (
                    <div className="mx-auto mt-7 max-w-sm rounded-3xl glass-dark p-4">
                        <div className="flex items-center justify-between text-xs font-bold text-brand-100">
                            <span>Today's progress</span>
                            <span>{handled}/{mine.length} handled</span>
                        </div>
                        <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                                style={{ width: `${progress}%`, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }}
                            />
                        </div>
                    </div>
                )}
            </header>

            <main className="relative mx-auto mt-9 max-w-xl space-y-4 px-5">
                {status === "loading" && (
                    <div className="space-y-3">
                        {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/10" />)}
                    </div>
                )}
                {status === "failed" && (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-pop">
                        <span className="text-5xl">📡</span>
                        <p className="mt-3 font-display text-lg font-extrabold">Couldn't load your doses</p>
                        <p className="mt-1 text-sm text-stone-500">{error || "Please check your connection and try again."}</p>
                        <button
                            onClick={() => dispatch(fetchToday())}
                            className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-110"
                        >
                            Retry
                        </button>
                    </div>
                )}
                {status !== "loading" && status !== "failed" && mine.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl bg-white p-10 text-center shadow-pop">
                        <span className="text-5xl">🌤️</span>
                        <p className="mt-3 font-display text-lg font-extrabold">No medicines scheduled today</p>
                        <p className="mt-1 text-sm text-stone-500">Enjoy the day — your family has your schedule covered.</p>
                    </motion.div>
                )}
                {pending.length > 0 && (
                    <div className="space-y-4">
                        <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-amber-300">
                            <span className="h-2 w-2 animate-ping rounded-full bg-amber-300" /> Waiting for you
                        </p>
                        {pending.map((dose, i) => (
                            <div key={dose._id} className="animate-rise" style={{ animationDelay: `${i * 90}ms` }}>
                                <DoseCard dose={dose} big showMember={false} />
                            </div>
                        ))}
                    </div>
                )}
                {others.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-extrabold uppercase tracking-widest text-brand-200/80">Already handled today</p>
                        {others.map((dose, i) => (
                            <div key={dose._id}
                                className={`animate-rise flex items-center gap-4 rounded-3xl p-5 shadow-card ${
                                    dose.status === "taken"
                                        ? "bg-gradient-to-r from-emerald-400/95 to-teal-400/95 text-emerald-950"
                                        : dose.status === "missed"
                                            ? "bg-gradient-to-r from-rose-400/95 to-pink-400/95 text-rose-950"
                                            : "bg-white/90 text-ink"
                                }`}>
                                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm ${
                                    dose.status === "taken" ? "bg-white/80" : dose.status === "missed" ? "bg-white/80" : "bg-stone-100"
                                }`}>
                                    {dose.status === "taken" ? "✅" : dose.status === "missed" ? "🔕" : "⏭️"}
                                </span>
                                <div className="flex-1">
                                    <p className="font-display text-lg font-extrabold">{dose.medication?.name}</p>
                                    <p className="text-sm font-semibold opacity-80">
                                        {dose.timeLabel} · {dose.status === "taken" ? "Taken" : dose.status === "missed" ? "Missed — family informed" : "Skipped"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="pt-8 text-center text-xs font-semibold text-brand-100/60">
                    {family?.name || "MedMate"} — your caregivers see this status live
                </p>
            </main>
        </div>
    );
}
