import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchToday } from "../redux/scheduleSlice.js";
import { useAuth } from "../context/AuthContext.jsx";
import DoseCard from "../components/DoseCard.jsx";
import Avatar from "../components/Avatar.jsx";

export default function MyMeds() {
    const dispatch = useDispatch();
    const { doses, todayLabel, error } = useSelector((s) => s.schedule);
    const { user, family } = useAuth();
    const [ready, setReady] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const refresh = async (showBusy = false) => {
        if (showBusy) setRefreshing(true);
        try { await dispatch(fetchToday()).unwrap(); setReady(true); }
        catch { setReady(true); }
        finally { setRefreshing(false); }
    };
    useEffect(() => {
        let live = true;
        dispatch(fetchToday()).unwrap().finally(() => { if (live) setReady(true); });
        const timer = setInterval(() => dispatch(fetchToday()), 30000);
        return () => { live = false; clearInterval(timer); };
    }, [dispatch]);

    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        for (const dose of doses) {
            if (dose.status !== "pending") continue;
            const dueAt = new Date(dose.scheduledFor).getTime();
            if (Date.now() - dueAt > 5 * 60000 || dueAt - Date.now() > 20000) continue;
            const key = `notified-${dose._id}-${dose.snoozeCount}`;
            if (localStorage.getItem(key)) continue;
            localStorage.setItem(key, "1");
            new Notification(`${dose.medication?.name || "Medicine"} is due`, { body: dose.medication?.instructions || "Time to take your dose.", tag: dose._id });
        }
    }, [doses]);

    const pending = doses.filter(d => d.status === "pending");
    const handled = doses.filter(d => ["taken", "skipped", "missed"].includes(d.status));
    const taken = doses.filter(d => d.status === "taken").length;
    const missed = doses.filter(d => d.status === "missed").length;
    const skipped = doses.filter(d => d.status === "skipped").length;
    const progress = doses.length ? Math.round((taken / doses.length) * 100) : 0;
    const date = todayLabel ? new Date(`${todayLabel}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : "Your daily plan";

    return <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#073c3c] via-teal-800 to-brand-950 p-6 text-white shadow-pop sm:p-8">
            <div className="absolute -right-10 -top-14 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-4"><Avatar name={user?.name || "Me"} src={user?.avatar} size={68} ring /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-200">{date}</p><h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Hello, {user?.name?.split(" ")[0] || "there"} 👋</h1><p className="mt-1 text-sm font-semibold text-white/70">One dose at a time. You’ve got this.</p></div><button onClick={() => refresh(true)} disabled={refreshing} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-white/20 disabled:opacity-60">{refreshing ? "Updating…" : "↻ Refresh"}</button></div>
            {ready && <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/10 p-4"><div className="flex items-center justify-between gap-3 text-sm font-bold"><span>Today's progress</span><span>{taken} of {doses.length} taken · {progress}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200 transition-all duration-700" style={{width:`${progress}%`}} /></div></div>}
        </section>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Due now",pending.length,"⏰","text-amber-700","bg-amber-50"],["Taken today",taken,"✅","text-emerald-700","bg-emerald-50"],["Handled",handled.length,"🧾","text-brand-800","bg-brand-50"],["To go",pending.length,"💪","text-violet-700","bg-violet-50"]].map(([label,value,icon,tone,bg])=><div key={label} className="rounded-2xl border border-stone-100 bg-white p-4 shadow-card"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${bg}`}>{icon}</span><p className={`mt-3 text-2xl font-extrabold ${tone}`}>{value}</p><p className="mt-0.5 text-xs font-extrabold uppercase tracking-wide text-stone-400">{label}</p></div>)}</section>
        <section className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
            <div className="space-y-4"><div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Today’s schedule</h2><p className="text-sm text-stone-500">Confirm a dose after you take it.</p></div><Link to="/my-meds/history" className="shrink-0 text-sm font-extrabold text-brand-800 hover:underline">History →</Link></div>
                {!ready && <div className="space-y-3">{[0,1].map(i=><div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />)}</div>}
                {ready && error && doses.length===0 && <div className="rounded-3xl bg-white p-8 text-center shadow-card"><p className="font-extrabold">Couldn’t load today’s plan</p><p className="mt-1 text-sm text-stone-500">{error}</p><button onClick={()=>refresh(true)} className="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Try again</button></div>}
                {ready && !error && pending.length===0 && <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`rounded-3xl border bg-white p-8 text-center shadow-card ${missed || skipped ? "border-amber-100" : "border-emerald-100"}`}><span className="text-5xl">{!doses.length ? "💊" : missed ? "🔔" : skipped ? "📝" : "🎉"}</span><h3 className="mt-3 font-display text-xl font-extrabold">{!doses.length ? "No medicines scheduled today" : missed || skipped ? "Today's schedule has been handled" : "You’re all caught up!"}</h3><p className="mt-1 text-sm text-stone-500">{!doses.length ? "Your care circle will show your medicines here when a schedule is set." : missed || skipped ? `${taken} taken · ${missed} missed · ${skipped} skipped. Your care circle can review the same record.` : "Your scheduled doses are handled. Enjoy the rest of your day."}</p></motion.div>}
                {ready && pending.map((dose,i)=><div key={dose._id} className="animate-rise" style={{animationDelay:`${i*70}ms`}}><DoseCard dose={dose} big showMember={false}/></div>)}
                {ready && handled.length>0 && <details className="rounded-2xl bg-white p-4 shadow-card"><summary className="cursor-pointer font-extrabold">Completed and skipped today ({handled.length})</summary><div className="mt-3 space-y-2">{handled.map(d=><div key={d._id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"><span className="truncate font-bold">{d.medication?.name} · {d.timeLabel}</span><span className="ml-2 font-extrabold capitalize text-stone-500">{d.status}</span></div>)}</div></details>}
            </div>
            <aside className="space-y-4"><section className="rounded-3xl bg-white p-5 shadow-card"><h2 className="font-display text-lg font-extrabold">Your care circle</h2><p className="mt-1 text-sm text-stone-500">{family?.name || "Your family"} can see your dose status and help if something is missed.</p><Link to="/my-meds/alerts" className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm font-extrabold text-brand-900">View your alerts <span>→</span></Link></section>
                <section className="rounded-3xl bg-white p-5 shadow-card"><h2 className="font-display text-lg font-extrabold">Quick links</h2><div className="mt-3 space-y-2">{[["/my-meds/medicines","💊","Medicine list"],["/my-meds/progress","📈","My progress"],["/my-meds/history","🗓️","Dose history"]].map(([to,icon,label])=><Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 font-bold transition hover:border-brand-200 hover:bg-brand-50"><span className="text-xl">{icon}</span>{label}<span className="ml-auto text-stone-400">→</span></Link>)}</div></section>
                <p className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold leading-relaxed text-emerald-900">If a dose does not feel right or you have questions, contact your caregiver or clinician. MedMate helps track your plan; it does not replace medical advice.</p>
            </aside>
        </section>
    </div>;
}
