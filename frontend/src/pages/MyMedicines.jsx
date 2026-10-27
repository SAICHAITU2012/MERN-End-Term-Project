import { useEffect, useState } from "react";
import api from "../api/axios.js";
import EmptyState from "../components/EmptyState.jsx";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formIcon = { tablet: "💊", capsule: "💊", syrup: "🥄", injection: "💉", drops: "💧", inhaler: "🌬️", other: "🩺" };

export default function MyMedicines() {
    const [medications, setMedications] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const load = async () => {
        setStatus("loading"); setError("");
        try { const { data } = await api.get("/api/medications?active=true"); setMedications(data.medications || []); setStatus("ready"); }
        catch (e) { setError(e.friendly || "Please try again."); setStatus("error"); }
    };
    useEffect(() => { load(); }, []);

    return <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-emerald-700 via-teal-700 to-brand-900 p-6 text-white shadow-pop sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-100">Your treatment plan</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold">My medicines</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/75">Check your dose, timing, and instructions. Your caregiver manages changes to this list.</p>
            <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold">{medications.length} active {medications.length === 1 ? "medicine" : "medicines"}</div>
        </section>
        {status === "loading" && <div className="grid gap-4 sm:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-3xl bg-white" />)}</div>}
        {status === "error" && <div className="rounded-3xl bg-white p-8 text-center shadow-card"><p className="font-bold">Couldn’t load your medicines</p><p className="mt-1 text-sm text-stone-500">{error}</p><button onClick={load} className="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Try again</button></div>}
        {status === "ready" && medications.length === 0 && <EmptyState emoji="💊" title="Your list is ready for your caregiver" body="When medicines are added to your care plan, you’ll see the dose times and instructions here." />}
        {status === "ready" && medications.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{medications.map((med) => <article key={med._id} className="rounded-3xl border border-stone-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
            <div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">{formIcon[med.form] || "💊"}</span><div className="min-w-0 flex-1"><h2 className="font-display text-xl font-extrabold">{med.name}</h2><p className="mt-0.5 text-sm font-semibold text-stone-500">{med.dosage || "As prescribed"}</p></div></div>
            {med.instructions && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">📌 {med.instructions}</p>}
            <div className="mt-4"><p className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Dose times</p><div className="mt-2 flex flex-wrap gap-2">{(med.doseTimes || []).map((time) => <span key={time} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-extrabold text-brand-800">⏰ {time}</span>)}</div></div>
            <p className="mt-4 text-xs font-semibold text-stone-500">{(med.daysOfWeek || days.map((_,i)=>i)).length === 7 ? "Every day" : (med.daysOfWeek || []).map((d) => days[d]).filter(Boolean).join(" · ")}</p>
        </article>)}</div>}
    </div>;
}
