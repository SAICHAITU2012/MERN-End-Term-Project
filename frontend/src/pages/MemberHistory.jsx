import { useEffect, useState } from "react";
import api from "../api/axios.js";

const styles = { taken: "bg-emerald-50 text-emerald-800", missed: "bg-rose-50 text-rose-800", skipped: "bg-amber-50 text-amber-800", pending: "bg-brand-50 text-brand-800", cancelled: "bg-stone-100 text-stone-600" };
const labels = { taken: "Taken", missed: "Missed", skipped: "Skipped", pending: "Waiting", cancelled: "Cancelled" };

export default function MemberHistory() {
    const [doses, setDoses] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState("all");
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let live = true;
        setStatus("loading"); setError("");
        api.get(`/api/doses/history?page=${page}&limit=30`).then(({ data }) => {
            if (!live) return; setDoses(data.doses || []); setPages(data.pages || 1); setStatus("ready");
        }).catch((e) => { if (live) { setError(e.friendly || "Please try again."); setStatus("error"); } });
        return () => { live = false; };
    }, [page, reload]);
    const filtered = doses.filter((dose) => filter === "all" || dose.status === filter);
    const grouped = filtered.reduce((groups, dose) => { (groups[dose.dateLabel] ||= []).push(dose); return groups; }, {});
    return <div className="space-y-6">
        <header><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand-700">Your record</p><h1 className="mt-1 font-display text-3xl font-extrabold">Dose history</h1><p className="mt-1 text-sm text-stone-500">Review what you took, skipped, or still need to confirm.</p></header>
        <div className="flex flex-wrap gap-2">{["all","taken","missed","skipped","pending"].map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-extrabold capitalize ${filter===value ? "bg-ink text-white" : "bg-white text-stone-600 shadow-card"}`}>{value === "all" ? "All doses" : labels[value]}</button>)}</div>
        {status === "loading" && <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-3xl bg-white" />)}</div>}
        {status === "error" && <div className="rounded-3xl bg-white p-8 text-center text-sm font-semibold text-rose-700 shadow-card">{error}<button onClick={() => setReload((v) => v + 1)} className="ml-3 underline">Retry</button></div>}
        {status === "ready" && filtered.length === 0 && <div className="rounded-3xl bg-white p-10 text-center shadow-card"><span className="text-4xl">🗓️</span><p className="mt-3 font-display text-lg font-extrabold">No doses in this view</p><p className="mt-1 text-sm text-stone-500">Try another filter or check back after your next scheduled dose.</p></div>}
        {status === "ready" && Object.entries(grouped).map(([date, rows]) => <section key={date} className="space-y-3"><h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-stone-500">{new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2>{rows.map(dose => <article key={dose._id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-50 text-xl">💊</span><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{dose.medication?.name || "Medicine"}</p><p className="text-sm text-stone-500">{dose.timeLabel} · {dose.medication?.dosage || "Scheduled dose"}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${styles[dose.status] || styles.pending}`}>{labels[dose.status] || dose.status}</span></article>)}</section>)}
        {status === "ready" && pages > 1 && <div className="flex items-center justify-center gap-4"><button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="rounded-xl bg-white px-4 py-2 font-bold shadow-card disabled:opacity-40">← Newer</button><span className="text-sm font-bold text-stone-500">Page {page} of {pages}</span><button disabled={page>=pages} onClick={() => setPage(p=>p+1)} className="rounded-xl bg-white px-4 py-2 font-bold shadow-card disabled:opacity-40">Older →</button></div>}
    </div>;
}
