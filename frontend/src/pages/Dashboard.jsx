import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import DoseCard from "../components/DoseCard.jsx";
import AdherenceRing from "../components/AdherenceRing.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PillIcon, PlusIcon, AlertIcon, BellIcon, ClipboardIcon, CheckIcon, ClockIcon } from "../components/icons.jsx";

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: "Good morning", emoji: "🌅" };
    if (h < 17) return { text: "Good afternoon", emoji: "☀️" };
    return { text: "Good evening", emoji: "🌙" };
};

export default function Dashboard() {
    const { user, family } = useAuth();
    const { doses, todayLabel, status, error } = useSelector((s) => s.schedule);
    const [summaries, setSummaries] = useState([]);
    const [meds, setMeds] = useState([]);

    useEffect(() => {
        api.get("/api/reports/family?days=7").then(({ data }) => setSummaries(data.summaries)).catch(() => {});
        api.get("/api/medications?active=true").then(({ data }) => setMeds(data.medications)).catch(() => {});
    }, []);

    // one-time: invite browser notifications (the demo moment!)
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            const t = setTimeout(() => Notification.requestPermission(), 2500);
            return () => clearTimeout(t);
        }
    }, []);

    const pending = doses.filter((d) => d.status === "pending");
    const dueNow = pending.filter((d) => new Date(d.scheduledFor).getTime() <= Date.now());
    const upcoming = pending.filter((d) => new Date(d.scheduledFor).getTime() > Date.now());
    const missed = doses.filter((d) => d.status === "missed");
    const taken = doses.filter((d) => d.status === "taken");
    const done = doses.filter((d) => d.status === "taken" || d.status === "skipped" || d.status === "cancelled");
    const refillNeeded = meds.filter((m) => m.stockCount <= m.stockThreshold);
    const dateLabelPretty = todayLabel
        ? new Date(`${todayLabel}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
        : "";
    const g = greeting();

    const chips = [
        { icon: CheckIcon, label: "Taken today", value: taken.length, hue: "from-emerald-500 to-teal-500" },
        { icon: ClockIcon, label: "Still to come", value: pending.length, hue: "from-amber-400 to-orange-400" },
        { icon: AlertIcon, label: "Missed", value: missed.length, hue: "from-rose-500 to-pink-500" },
        { icon: PillIcon, label: "Active meds", value: meds.length, hue: "from-violet-500 to-fuchsia-500" },
    ];

    return (
        <div className="space-y-6">
            {/* gradient hero band */}
            <section className="ring-gradient relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-7 text-white shadow-pop sm:p-9">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-2xl" />
                <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-gradient-to-br from-amber-400/25 to-rose-400/15 blur-2xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
                            {g.text}, {user.name.split(" ")[0]} {g.emoji}
                        </h1>
                        <p className="mt-2 font-semibold text-brand-100/85">
                            {dateLabelPretty} · {family?.timezone?.replace("_", " ")} ·{" "}
                            {pending.length > 0 ? `${pending.length} dose${pending.length === 1 ? "" : "s"} left today` : "all doses handled today 🎉"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/medications" className="rounded-2xl glass-dark px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">
                            💊 Medications
                        </Link>
                        <Link to="/reports" className="btn-shine rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-brand-900 shadow-sm transition hover:brightness-95">
                            📄 Doctor report
                        </Link>
                    </div>
                </div>

                {/* colorful stat chips */}
                <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {chips.map(({ icon: Icon, label, value, hue }, i) => (
                        <div
                            key={label}
                            className="animate-rise rounded-2xl glass-dark p-4"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${hue} text-white shadow-sm`}>
                                <Icon size={16} />
                            </span>
                            <p className="mt-3 font-display text-3xl font-extrabold leading-none">{value}</p>
                            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-brand-100/70">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{error}</div>
            )}

            {/* due now — the hero strip */}
            {dueNow.length > 0 && (
                <section className="ring-gradient rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-card">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-amber-700">
                        <BellIcon size={16} /> Due right now · needs a decision
                    </h2>
                    <div className="space-y-2.5">
                        {dueNow.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                    </div>
                </section>
            )}

            {/* refill alerts */}
            {refillNeeded.length > 0 && (
                <section className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-pink-50 p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-rose-600">
                        <AlertIcon size={16} /> Refill needed
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {refillNeeded.map((m) => (
                            <span key={m._id} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-rose-700 shadow-sm ring-1 ring-rose-100">
                                {m.name} · {m.stockCount} left for {m.member?.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* today timeline */}
                <section className="space-y-4 lg:col-span-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-stone-400">Today's timeline</h2>
                    {status === "loading" && (
                        <div className="space-y-2.5">
                            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-3xl bg-stone-100" />)}
                        </div>
                    )}
                    {status !== "loading" && doses.length === 0 && (
                        <EmptyState
                            emoji="🌞"
                            title="Nothing scheduled for today"
                            body="When a dose time arrives, it appears here — and MedMate starts watching for the confirmation."
                            action={<Link to="/medications" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white"><PlusIcon size={15} /> Add a medication</Link>}
                        />
                    )}
                    {missed.length > 0 && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-rose-400">Missed — caregivers were alerted</p>
                            {missed.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                    {upcoming.length > 0 && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Upcoming</p>
                            {upcoming.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                    {done.length > 0 && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500/90">Handled</p>
                            {done.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                </section>

                {/* adherence snapshot */}
                <section className="space-y-4">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-stone-400">7-day adherence</h2>
                    {summaries.length === 0 && <div className="h-24 animate-pulse rounded-3xl bg-stone-100" />}
                    {summaries.map((m, i) => (
                        <Link
                            key={m._id}
                            to={`/members/${m._id}`}
                            className="animate-rise flex items-center gap-4 rounded-3xl border border-stone-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
                            style={{ animationDelay: `${i * 90}ms` }}
                        >
                            <AdherenceRing pct={m.adherencePct} size={58} />
                            <div className="min-w-0">
                                <p className="truncate font-extrabold">{m.name}</p>
                                <p className="text-xs font-semibold text-stone-500">
                                    {m.taken} taken · {m.missed} missed · {m.skipped} skipped
                                </p>
                            </div>
                        </Link>
                    ))}
                    {summaries.length > 0 && (
                        <Link to="/reports" className="block rounded-3xl border border-dashed border-stone-300 p-4 text-center text-sm font-extrabold text-stone-500 transition hover:border-brand-400 hover:text-brand-700">
                            Open full reports →
                        </Link>
                    )}
                </section>
            </div>
        </div>
    );
}
