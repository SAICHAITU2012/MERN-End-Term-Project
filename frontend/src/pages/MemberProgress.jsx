import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import AdherenceRing from "../components/AdherenceRing.jsx";

export default function MemberProgress() {
    const { user } = useAuth();
    const [days, setDays] = useState(30);
    const [report, setReport] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    useEffect(() => {
        let live = true; setStatus("loading"); setReport(null); setError("");
        api.get(`/api/reports/member/${user?.linkedMember}?days=${days}`).then(({ data }) => { if(live) { setReport(data); setStatus("ready"); } }).catch(e => { if(live) { setError(e.friendly || "Could not load your progress."); setStatus("error"); } });
        return () => { live = false; };
    }, [days, user?.linkedMember]);
    return <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand-700">Small steps add up</p><h1 className="mt-1 font-display text-3xl font-extrabold">My progress</h1><p className="mt-1 text-sm text-stone-500">A helpful summary of your recent dose routine.</p></div><div className="flex gap-2">{[7,30,90].map(n=><button key={n} onClick={()=>setDays(n)} className={`rounded-full px-4 py-2 text-sm font-extrabold ${days===n?"bg-ink text-white":"bg-white text-stone-600 shadow-card"}`}>{n} days</button>)}</div></header>
        {status === "loading" && <div className="h-64 animate-pulse rounded-3xl bg-white" />}
        {status === "error" && <div className="rounded-3xl bg-white p-8 text-center font-semibold text-rose-700 shadow-card">{error}</div>}
        {status === "ready" && report && <>
            <section className="flex flex-wrap items-center gap-5 rounded-3xl bg-gradient-to-br from-brand-900 to-emerald-800 p-6 text-white shadow-pop"><div className="flex-1"><p className="text-xs font-extrabold uppercase tracking-wide text-white/60">{days}-day summary</p><h2 className="mt-1 font-display text-2xl font-extrabold">You’re building a routine, {report.member.name.split(" ")[0]}.</h2><p className="mt-2 text-sm text-white/75">{report.totals.taken} taken · {report.totals.missed} missed · {report.totals.skipped} skipped</p></div><AdherenceRing pct={report.adherencePct} size={96} stroke={9} label="adherence" /></section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Taken",report.totals.taken,"text-emerald-700"],["Missed",report.totals.missed,"text-rose-600"],["Skipped",report.totals.skipped,"text-amber-700"],["Best streak",`${report.streakDays} days`,"text-brand-700"]].map(([l,v,c])=><div key={l} className="rounded-2xl bg-white p-4 shadow-card"><p className={`text-2xl font-extrabold ${c}`}>{v}</p><p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-stone-400">{l}</p></div>)}</div>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-extrabold">Daily routine</h2><span className="text-xs font-semibold text-stone-400">Taken / scheduled</span></div><div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2">{report.perDay.map(day=><div key={day.dateLabel} title={`${day.dateLabel}: ${day.taken}/${day.total} taken`} className={`rounded-xl p-2 text-center ${day.total===0?"bg-stone-50":day.pct===100?"bg-emerald-100":day.pct>=70?"bg-amber-100":"bg-rose-100"}`}><p className="text-[9px] font-bold text-stone-500">{day.dateLabel.slice(5)}</p><p className="mt-1 text-xs font-extrabold">{day.total?`${day.taken}/${day.total}`:"—"}</p></div>)}</div></section>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-6"><h2 className="font-display text-lg font-extrabold">By medicine</h2>{report.perMedication.length===0?<p className="py-6 text-sm text-stone-500">Your report will fill in as doses are recorded.</p>:<div className="mt-4 space-y-4">{report.perMedication.map(m=><div key={m.medication?._id || m.medication?.name}><div className="flex justify-between gap-3"><p className="font-bold">{m.medication?.name||"Medicine"}</p><p className="font-extrabold text-brand-800">{m.pct}%</p></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{width:`${m.pct}%`}} /></div><p className="mt-1 text-xs text-stone-500">{m.taken} taken · {m.missed} missed · {m.skipped} skipped</p></div>)}</div>}</section>
        </>}
    </div>;
}
