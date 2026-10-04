import { useDispatch } from "react-redux";
import { actOnDose } from "../redux/scheduleSlice.js";
import { useToast } from "./Toast.jsx";
import { CheckIcon, XIcon, SnoozeIcon, ClockIcon, AlertIcon } from "./icons.jsx";

const STATUS_STYLE = {
    pending: { chip: "bg-amber-100 text-amber-800", label: "Due" },
    taken: { chip: "bg-emerald-100 text-emerald-700", label: "Taken" },
    skipped: { chip: "bg-stone-200 text-stone-600", label: "Skipped" },
    missed: { chip: "bg-rose-100 text-rose-700", label: "Missed" },
    cancelled: { chip: "bg-stone-100 text-stone-400", label: "Cancelled" },
};

const FORM_EMOJI = { tablet: "💊", capsule: "💊", syrup: "🥣", injection: "💉", drops: "💧", inhaler: "🌬️", other: "🩺" };

// One dose card. Used on the caregiver dashboard (compact) and the
// member self-view (large touch targets).
export default function DoseCard({ dose, big = false, showMember = true }) {
    const dispatch = useDispatch();
    const toast = useToast();
    const med = dose.medication || {};
    const style = STATUS_STYLE[dose.status] || STATUS_STYLE.pending;
    const isPending = dose.status === "pending";
    const dueNow = isPending && new Date(dose.scheduledFor).getTime() <= Date.now();

    const act = (action, payload) => {
        dispatch(actOnDose({ id: dose._id, action, payload }))
            .unwrap()
            .then(() => {
                if (action === "taken") toast(`${med.name} confirmed taken ✅`);
                if (action === "skipped") toast("Dose marked as skipped — caregivers notified");
                if (action === "snooze") toast("Snoozed for 15 minutes");
            })
            .catch((msg) => toast(msg, "error"));
    };

    return (
        <div
            className={`flex items-center gap-4 rounded-2xl border bg-white shadow-card transition ${
                dueNow ? "border-amber-300 pulse-due" : "border-stone-100"
            } ${big ? "flex-col items-stretch gap-3 p-6" : "p-4"}`}
        >
            <div className={`flex items-center gap-4 ${big ? "" : "min-w-0 flex-1"}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl">
                    {FORM_EMOJI[med.form] || "💊"}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate font-bold ${big ? "text-xl" : "text-[15px]"}`}>{med.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${style.chip}`}>{style.label}</span>
                        {dose.status === "missed" && !dose.actedAt && <span className="text-[11px] font-semibold text-rose-500">caregivers alerted</span>}
                        {dose.snoozeCount > 0 && isPending && (
                            <span className="text-[11px] font-semibold text-amber-600">snoozed ×{dose.snoozeCount}</span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-stone-500">
                        {showMember && dose.member?.name && <span className="font-semibold text-stone-700">{dose.member.name} · </span>}
                        {med.dosage || "1 dose"} · {dose.timeLabel}
                        {med.instructions ? ` · ${med.instructions}` : ""}
                    </p>
                    {dose.note && <p className="mt-1 truncate text-xs italic text-stone-400">"{dose.note}"</p>}
                </div>
            </div>

            {isPending && (
                <div className={`flex gap-2 ${big ? "[&>button]:flex-1 [&>button]:py-4 [&>button]:text-base" : ""}`}>
                    <button
                        onClick={() => act("taken")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                        <CheckIcon size={16} /> {big ? "I took it" : "Taken"}
                    </button>
                    <button
                        onClick={() => act("skipped", {})}
                        className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-3.5 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-200 active:scale-[0.98]"
                        title="Skip this dose"
                    >
                        <XIcon size={16} /> <span className={big ? "" : "hidden sm:inline"}>Skip</span>
                    </button>
                    <button
                        onClick={() => act("snooze")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-amber-100 px-3.5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-200 active:scale-[0.98]"
                        title="Snooze 15 minutes"
                    >
                        <SnoozeIcon size={16} /> <span className={big ? "" : "hidden sm:inline"}>15m</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export { STATUS_STYLE, FORM_EMOJI };
