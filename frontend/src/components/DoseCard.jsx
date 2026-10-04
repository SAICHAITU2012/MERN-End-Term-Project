import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { actOnDose } from "../redux/scheduleSlice.js";
import { useToast } from "./Toast.jsx";
import { CheckIcon, XIcon, SnoozeIcon, AlertIcon } from "./icons.jsx";

const STATUS_STYLE = {
    pending: { chip: "bg-gradient-to-r from-amber-400 to-orange-400 text-white", label: "Due", bar: "bg-gradient-to-b from-amber-400 to-orange-400", tile: "bg-amber-50" },
    taken: { chip: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white", label: "Taken", bar: "bg-gradient-to-b from-emerald-400 to-teal-500", tile: "bg-emerald-50" },
    skipped: { chip: "bg-stone-300 text-stone-700", label: "Skipped", bar: "bg-stone-300", tile: "bg-stone-100" },
    missed: { chip: "bg-gradient-to-r from-rose-500 to-pink-500 text-white", label: "Missed", bar: "bg-gradient-to-b from-rose-400 to-pink-500", tile: "bg-rose-50" },
    cancelled: { chip: "bg-stone-100 text-stone-400", label: "Cancelled", bar: "bg-stone-200", tile: "bg-stone-50" },
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
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-white shadow-card transition-shadow hover:shadow-pop ${
                dueNow ? "border-amber-300 pulse-due" : "border-stone-100"
            } ${big ? "flex-col items-stretch gap-3 p-6" : "p-4"}`}
        >
            {/* status accent spine */}
            <span className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} />

            <div className={`flex items-center gap-4 ${big ? "" : "min-w-0 flex-1 pl-2"}`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ${style.tile}`}>
                    {FORM_EMOJI[med.form] || "💊"}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className={`truncate font-extrabold ${big ? "font-display text-2xl" : "text-[15px]"}`}>{med.name}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${style.chip}`}>{style.label}</span>
                        {dose.status === "missed" && !dose.actedAt && (
                            <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-500">
                                <AlertIcon size={12} /> caregivers alerted
                            </span>
                        )}
                        {dose.snoozeCount > 0 && isPending && (
                            <span className="text-[11px] font-extrabold text-amber-600">snoozed ×{dose.snoozeCount}</span>
                        )}
                    </div>
                    <p className={`mt-0.5 truncate text-stone-500 ${big ? "text-base" : "text-sm"}`}>
                        {showMember && dose.member?.name && <span className="font-bold text-stone-700">{dose.member.name} · </span>}
                        {med.dosage || "1 dose"} · {dose.timeLabel}
                        {med.instructions ? ` · ${med.instructions}` : ""}
                    </p>
                    {dose.note && <p className="mt-1 truncate text-xs italic text-stone-400">"{dose.note}"</p>}
                </div>
            </div>

            {isPending && (
                <div className={`flex gap-2 ${big ? "[&>button]:flex-1 [&>button]:py-5 [&>button]:text-lg" : ""}`}>
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => act("taken")}
                        className="btn-shine flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:brightness-110"
                    >
                        <CheckIcon size={16} /> {big ? "I took it" : "Taken"}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => act("skipped", {})}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-stone-100 px-3.5 py-2.5 text-sm font-extrabold text-stone-600 transition hover:bg-stone-200"
                        title="Skip this dose"
                    >
                        <XIcon size={16} /> <span className={big ? "" : "hidden sm:inline"}>Skip</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => act("snooze")}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-amber-100 px-3.5 py-2.5 text-sm font-extrabold text-amber-700 transition hover:bg-amber-200"
                        title="Snooze 15 minutes"
                    >
                        <SnoozeIcon size={16} /> <span className={big ? "" : "hidden sm:inline"}>15m</span>
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
}

export { STATUS_STYLE, FORM_EMOJI };
