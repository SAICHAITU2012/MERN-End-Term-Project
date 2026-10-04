import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";
import AdherenceRing from "../components/AdherenceRing.jsx";
import Avatar from "../components/Avatar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { ChartIcon } from "../components/icons.jsx";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// member profile: 35-day adherence heatmap + per-medication breakdown
export default function MemberDetail() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        setReport(null);
        setStatus("loading");
        api.get(`/api/reports/member/${id}?days=30`)
            .then(({ data }) => setReport(data))
            .catch(() => setStatus("error"))
            .finally(() => setStatus("ready"));
    }, [id]);

    if (status === "loading") {
        return <div className="animate-rise space-y-4">{[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-stone-100" />)}</div>;
    }
    if (status === "error" || !report) {
        return <EmptyState emoji="🔍" title="Member not found" body="They may have been removed from the family." />;
    }

    const last35 = report.perDay.slice(-35);
    const heat = (day) => {
        if (day.total === 0) return "bg-stone-100";
        if (day.pct >= 100) return "bg-emerald-500";
        if (day.pct >= 75) return "bg-emerald-300";
        if (day.pct >= 50) return "bg-amber-300";
        return "bg-rose-400";
    };

    return (
        <div className="animate-rise space-y-6">
            {/* header */}
            <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-stone-100 bg-white p-6 shadow-card">
                <Avatar name={report.member.name} src={report.member.avatar} size={72} />
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight">{report.member.name}</h1>
                    <p className="mt-0.5 text-sm text-stone-500">
                        {[report.member.age && `${report.member.age} yrs`, report.member.gender, report.member.conditions].filter(Boolean).join(" · ") || "Family member"}
                    </p>
                    {report.member.doctor && <p className="mt-0.5 text-xs text-stone-400">👨‍⚕️ {report.member.doctor}</p>}
                </div>
                <AdherenceRing pct={report.adherencePct} size={88} stroke={9} label={`${report.rangeDays}d`} />
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Taken" value={report.totals.taken} tone="text-emerald-600" />
                <Stat label="Missed" value={report.totals.missed} tone="text-rose-500" />
                <Stat label="Skipped" value={report.totals.skipped} tone="text-amber-600" />
                <Stat label="Current streak" value={`${report.streakDays}d 🔥`} tone="text-brand-700" />
            </div>

            {/* heatmap */}
            <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-stone-400">
                        <ChartIcon size={15} /> Last {last35.length} days
                    </h2>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                        <span>missed</span><i className="h-3 w-3 rounded bg-rose-400" /><i className="h-3 w-3 rounded bg-amber-300" /><i className="h-3 w-3 rounded bg-emerald-300" /><i className="h-3 w-3 rounded bg-emerald-500" /><span>perfect</span>
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {last35.map((day, i) => (
                        <div key={day.dateLabel} className="group relative flex flex-col items-center gap-1.5">
                            {i % 7 === 0 && (
                                <span className="absolute -left-4 top-0 hidden text-[9px] font-bold text-stone-300 sm:block">
                                    {DAY_LABELS[new Date(`${day.dateLabel}T12:00:00`).getDay()]}
                                </span>
                            )}
                            <i
                                className={`h-8 w-8 shrink-0 rounded-lg transition group-hover:scale-110 ${heat(day)}`}
                                title={`${day.dateLabel}: ${day.taken}/${day.total} taken`}
                            />
                            <span className="text-[9px] font-semibold text-stone-400">{day.dateLabel.slice(8)}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* per-medication */}
            <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-card">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">By medication</h2>
                {report.perMedication.length === 0 ? (
                    <p className="py-8 text-center text-sm text-stone-400">No completed doses in this period yet.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {report.perMedication.map((m) => (
                            <div key={m.medication?._id || Math.random()}>
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="truncate text-sm font-bold">{m.medication?.name || "Removed medication"}</p>
                                    <p className={`text-sm font-extrabold ${m.pct >= 90 ? "text-emerald-600" : m.pct >= 70 ? "text-amber-600" : "text-rose-500"}`}>{m.pct}%</p>
                                </div>
                                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${m.pct >= 90 ? "bg-emerald-500" : m.pct >= 70 ? "bg-amber-400" : "bg-rose-400"}`}
                                        style={{ width: `${m.pct}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-stone-400">{m.taken} taken · {m.missed} missed · {m.skipped} skipped</p>
                            </div>
                        ))}
                    </div>
                )}
                <Link to="/reports" className="mt-5 block text-center text-xs font-bold text-brand-700 hover:underline">
                    Open the printable doctor-visit report →
                </Link>
            </section>
        </div>
    );
}

const Stat = ({ label, value, tone }) => (
    <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-card">
        <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p>
    </div>
);
