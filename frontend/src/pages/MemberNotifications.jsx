import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications, markAllRead } from "../redux/notificationSlice.js";

const icons = { dose_due: "⏰", dose_missed: "🚨", refill_low: "📦", weekly_digest: "📊", member_added: "👋", med_added: "💊", system: "ℹ️" };
export default function MemberNotifications() {
    const dispatch = useDispatch();
    const { items, unreadCount, status } = useSelector(s=>s.notifications);
    useEffect(()=>{ dispatch(fetchNotifications()); },[dispatch]);
    const visible = items; // The API already returns only notifications this member may see.
    return <div className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand-700">Stay in the loop</p><h1 className="mt-1 font-display text-3xl font-extrabold">Alerts and reminders</h1><p className="mt-1 text-sm text-stone-500">Important updates from your care circle.</p></div>{unreadCount>0&&<button onClick={()=>dispatch(markAllRead())} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold shadow-card">Mark all read</button>}</header>
        {status === "loading" && <div className="h-40 animate-pulse rounded-3xl bg-white"/>}
        {visible.length===0&&status!=="loading"&&<div className="rounded-3xl bg-white p-10 text-center shadow-card"><span className="text-4xl">🔔</span><p className="mt-3 font-display text-lg font-extrabold">All quiet for now</p><p className="mt-1 text-sm text-stone-500">Your reminders and care-circle updates will show up here.</p></div>}
        <div className="space-y-3">{visible.map(n=><article key={n._id} className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-card ${!n.isRead?"border-brand-200 ring-1 ring-brand-100":"border-stone-100"}`}><span className="text-2xl">{icons[n.type]||"ℹ️"}</span><div className="min-w-0 flex-1"><h2 className="font-extrabold">{n.title}</h2><p className="mt-1 text-sm text-stone-600">{n.body}</p><p className="mt-2 text-xs text-stone-400">{new Date(n.createdAt).toLocaleString("en-IN")}</p></div>{!n.isRead&&<span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600"/>}</article>)}</div>
    </div>;
}
