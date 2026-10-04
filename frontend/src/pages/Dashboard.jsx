import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import DoseCard from "../components/DoseCard.jsx";
import AdherenceRing from "../components/AdherenceRing.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PillIcon, PlusIcon, AlertIcon, BellIcon, ClipboardIcon } from "../components/icons.jsx";

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
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
    const done = doses.filter((d) => d.status === "taken" || d.status === "skipped" || d.status === "cancelled");
    const refillNeeded = meds.filter((m) => m.stockCount <= m.stockThreshold);
    const dateLabelPretty = todayLabel
        ? new Date(`${todayLabel}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
        : "";

    return (
        <div className="animate-rise space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, {user.name.split(" ")[0]} 👋</h1>
                    <p className="mt-1 text-sm text-stone-500">
                        {dateLabelPretty} · {family?.timezone?.replace("_", " ")} · {pending.length} dose{pending.length === 1 ? "" : "s"} left today
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/medications" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-stone-400">
                        <PillIcon size={16} /> Medications
                    </Link>
                    <Link to="/reports" className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-700">
                        <ClipboardIcon size={16} /> Doctor report
                    </Link>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</div>
            )}

            {/* due now — the hero strip */}
            {dueNow.length > 0 && (
                <section className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 shadow-card">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-amber-700">
                        <BellIcon size={16} /> Due right now · needs a decision
                    </h2>
                    <div className="space-y-2.5">
                        {dueNow.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                    </div>
                </section>
            )}

            {/* refill alerts */}
            {refillNeeded.length > 0 && (
                <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-rose-600">
                        <AlertIcon size={16} /> Refill needed
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {refillNeeded.map((m) => (
                            <span key={m._id} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm">
                                {m.name} · {m.stockCount} left for {m.member?.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* today timeline */}
                <section className="space-y-4 lg:col-span-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">Today's timeline</h2>
                    {status === "loading" && (
                        <div className="space-y-2.5">
                            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />)}
                        </div>
                    )}
                    {status !== "loading" && doses.length === 0 && (
                        <EmptyState
                            emoji="🌞"
                            title="Nothing scheduled for today"
                            body="When a dose time arrives, it appears here — and MedMate starts watching for the confirmation."
                            action={<Link to="/medications" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"><PlusIcon size={15} /> Add a medication</Link>}
                        />
                    )}
                    {missed.length > 0 && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-bold uppercase tracking-wide text-rose-400">Missed — caregivers were alerted</p>
                            {missed.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                    {upcoming.length > 0 && (
                        <div className="space-y-2.5">
                            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Upcoming</p>
                            {upcoming.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                    {done.length > 0 && (
                        <div className="space-y-2.5 opacity-80">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-500/80">Handled</p>
                            {done.map((dose) => <DoseCard key={dose._id} dose={dose} />)}
                        </div>
                    )}
                </section>

                {/* adherence snapshot */}
                <section className="space-y-4">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">7-day adherence</h2>
                    {summaries.length === 0 && <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />}
                    {summaries.map((m) => (
                        <Link key={m._id} to={`/members/${m._id}`} className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
                            <AdherenceRing pct={m.adherencePct} size={58} />
                            <div className="min-w-0">
                                <p className="truncate font-bold">{m.name}</p>
                                <p className="text-xs text-stone-500">
                                    {m.taken} taken · {m.missed} missed · {m.skipped} skipped
                                </p>
                            </div>
                        </Link>
                    ))}
                    {summaries.length > 0 && (
                        <Link to="/reports" className="block rounded-2xl border border-dashed border-stone-300 p-4 text-center text-sm font-bold text-stone-500 hover:border-brand-400 hover:text-brand-700">
                            Open full reports →
                        </Link>
                    )}
                </section>
            </div>
        </div>
    );
}
