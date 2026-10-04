import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchToday } from "../redux/scheduleSlice.js";
import { useAuth } from "../context/AuthContext.jsx";
import DoseCard from "../components/DoseCard.jsx";
import Avatar from "../components/Avatar.jsx";
import { PillIcon } from "../components/icons.jsx";

// Member self-view: deliberately extra-large touch targets and text —
// designed to be usable by a 70-year-old on a phone.
export default function MyMeds() {
    const dispatch = useDispatch();
    const { doses, todayLabel, status } = useSelector((s) => s.schedule);
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 pb-16">
            <header className="mx-auto max-w-xl px-5 pt-10 text-center text-white">
                <div className="mx-auto mb-4 w-fit">
                    <Avatar name={user?.name || "Me"} src={user?.avatar} size={72} ring />
                </div>
                <h1 className="text-3xl font-extrabold">Hello, {user?.name?.split(" ")[0] || "there"} 👋</h1>
                <p className="mt-1.5 text-brand-100">
                    {todayLabel
                        ? new Date(`${todayLabel}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
                        : ""}
                </p>
            </header>

            <main className="mx-auto mt-8 max-w-xl space-y-4 px-5">
                {status === "loading" && (
                    <div className="space-y-3">
                        {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/20" />)}
                    </div>
                )}
                {status !== "loading" && mine.length === 0 && (
                    <div className="rounded-3xl bg-white p-10 text-center shadow-pop">
                        <span className="text-4xl">🌤️</span>
                        <p className="mt-3 text-lg font-bold">No medicines scheduled today</p>
                        <p className="mt-1 text-sm text-stone-500">Enjoy the day — your family has your schedule covered.</p>
                    </div>
                )}
                {pending.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm font-extrabold uppercase tracking-wide text-amber-300">Waiting for you</p>
                        {pending.map((dose) => <DoseCard key={dose._id} dose={dose} big showMember={false} />)}
                    </div>
                )}
                {others.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-extrabold uppercase tracking-wide text-brand-200">Already handled today</p>
                        {others.map((dose) => (
                            <div key={dose._id} className="flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-sm">
                                <span className="text-2xl">✅</span>
                                <div className="flex-1">
                                    <p className="font-bold">{dose.medication?.name}</p>
                                    <p className="text-sm text-stone-500">
                                        {dose.timeLabel} · {dose.status === "taken" ? "Taken" : dose.status === "missed" ? "Missed — family informed" : "Skipped"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="pt-6 text-center text-xs text-brand-200/80">
                    <PillIcon size={12} className="mr-1 inline" /> {family?.name || "MedMate"} — your caregivers can see this status live
                </p>
            </main>
        </div>
    );
}
