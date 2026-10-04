import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdherenceRing from "../components/AdherenceRing.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { ClipboardIcon } from "../components/icons.jsx";

// printable per-member adherence report for doctor visits
export default function Reports() {
    const { family } = useAuth();
    const [members, setMembers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [days, setDays] = useState(30);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/family")
            .then(({ data }) => {
                setMembers(data.members);
                if (data.members.length) setSelected(data.members[0]._id);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        setReport(null);
        api.get(`/api/reports/member/${selected}?days=${days}`)
            .then(({ data }) => setReport(data))
            .catch(() => {});
    }, [selected, days]);

    if (!loading && members.length === 0) {
        return <EmptyState emoji="🧑‍🤝‍🧑" title="No members yet" body="Add a family member first — reports fill up as doses get confirmed." />;
    }

    return (
        <div className="animate-rise space-y-6">
            <div className="no-print flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Doctor-visit report</h1>
                    <p className="mt-1 text-sm text-stone-500">Adherence summary you can print or save as PDF and carry along.</p>
                </div>
                <button onClick={() => window.print()}
                    className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-110">
                    <ClipboardIcon size={16} /> Print / Save PDF
                </button>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
                {members.map((m) => (
                    <button key={m._id} onClick={() => setSelected(m._id)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${selected === m._id ? "bg-brand-600 text-white shadow-sm" : "bg-white text-stone-600 shadow-card hover:bg-stone-50"}`}>
                        {m.name}
                    </button>
                ))}
                <span className="mx-2 hidden h-6 w-px bg-stone-200 sm:block" />
                {[7, 30, 90].map((d) => (
                    <button key={d} onClick={() => setDays(d)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${days === d ? "bg-ink text-white" : "bg-white text-stone-600 shadow-card hover:bg-stone-50"}`}>
                        {d} days
                    </button>
                ))}
            </div>

            {!report && <div className="h-64 animate-pulse rounded-3xl bg-stone-100" />}

            {report && (
                <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-card sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
                        <div>
                            <h2 className="font-display text-xl font-extrabold">{report.member.name} — adherence report</h2>
                            <p className="mt-1 text-sm text-stone-500">
                                {family?.name} · {report.from} → {report.to} · generated {new Date().toLocaleDateString("en-IN")}
                            </p>
                            {report.member.doctor && <p className="text-xs text-stone-400">Doctor: {report.member.doctor}</p>}
                        </div>
                        <AdherenceRing pct={report.adherencePct} size={92} stroke={9} label="adherence" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Box label="Doses taken" value={report.totals.taken} tone="text-emerald-600" />
                        <Box label="Missed" value={report.totals.missed} tone="text-rose-500" />
                        <Box label="Skipped" value={report.totals.skipped} tone="text-amber-600" />
                        <Box label="Streak" value={`${report.streakDays} days`} tone="text-brand-700" />
                    </div>

                    {report.worstMedication && report.worstMedication.pct < 90 && (
                        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                            <strong>Worth discussing with the doctor:</strong> {report.worstMedication.medication?.name} is at {report.worstMedication.pct}% adherence
                            {report.bestMedication && report.bestMedication !== report.worstMedication && report.bestMedication.pct >= 95 && (
                                <> — while {report.bestMedication.medication?.name} is at {report.bestMedication.pct}%. A simpler schedule might help.</>
                            )}
                        </div>
                    )}

                    <section>
                        <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">Daily detail ({days} days)</h3>
                        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2">
                            {report.perDay.map((day) => (
                                <div key={day.dateLabel} className="rounded-xl border border-stone-100 p-2 text-center" title={`${day.dateLabel}`}>
                                    <p className="text-[10px] font-bold text-stone-400">{day.dateLabel.slice(5)}</p>
                                    <p className={`mt-1 text-sm font-extrabold ${
                                        day.total === 0 ? "text-stone-300" :
                                        day.pct === 100 ? "text-emerald-600" :
                                        day.pct >= 75 ? "text-emerald-500" :
                                        day.pct >= 50 ? "text-amber-500" : "text-rose-500"
                                    }`}>
                                        {day.total === 0 ? "—" : `${day.taken}/${day.total}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">By medication</h3>
                        <table className="mt-3 w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-stone-200 text-xs font-bold uppercase tracking-wide text-stone-400">
                                    <th className="py-2">Medicine</th>
                                    <th className="py-2 text-center">Taken</th>
                                    <th className="py-2 text-center">Missed</th>
                                    <th className="py-2 text-center">Skipped</th>
                                    <th className="py-2 text-right">Adherence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.perMedication.map((m) => (
                                    <tr key={m.medication?._id || Math.random()} className="border-b border-stone-50">
                                        <td className="py-2.5 font-bold">{m.medication?.name || "Removed"}</td>
                                        <td className="py-2.5 text-center">{m.taken}</td>
                                        <td className="py-2.5 text-center text-rose-500">{m.missed}</td>
                                        <td className="py-2.5 text-center text-amber-500">{m.skipped}</td>
                                        <td className={`py-2.5 text-right font-extrabold ${m.pct >= 90 ? "text-emerald-600" : m.pct >= 70 ? "text-amber-600" : "text-rose-500"}`}>{m.pct}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <p className="border-t border-stone-100 pt-4 text-[11px] text-stone-400">
                        Generated by MedMate — family medication adherence companion. Adherence = confirmed doses ÷ scheduled doses in the period.
                    </p>
                </div>
            )}
        </div>
    );
}

const Box = ({ label, value, tone }) => (
    <div className="rounded-2xl bg-stone-50 p-4">
        <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p>
    </div>
);
