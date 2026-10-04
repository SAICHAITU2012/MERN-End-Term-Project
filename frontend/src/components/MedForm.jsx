import { useState } from "react";
import api from "../api/axios.js";
import { useToast } from "./Toast.jsx";
import { PlusIcon, XIcon } from "./icons.jsx";

const FORMS = ["tablet", "capsule", "syrup", "injection", "drops", "inhaler", "other"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// shared add/edit medication form (used by onboarding + medications page)
// value: medication doc or null; onSaved(medication)
export default function MedForm({ memberId, members = [], value, onSaved, onCancel }) {
    const toast = useToast();
    const editing = Boolean(value?._id);
    const [form, setForm] = useState({
        memberId: value?.member?._id || value?.member || memberId || members[0]?._id || "",
        name: value?.name || "",
        dosage: value?.dosage || "",
        form: value?.form || "tablet",
        instructions: value?.instructions || "",
        doseTimes: value?.doseTimes || ["09:00"],
        daysOfWeek: value?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        stockCount: value?.stockCount ?? 30,
        stockThreshold: value?.stockThreshold ?? 5,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const toggleTime = (i, val) => {
        const times = [...form.doseTimes];
        times[i] = val;
        set("doseTimes", times);
    };

    const toggleDay = (d) => {
        const days = form.daysOfWeek.includes(d)
            ? form.daysOfWeek.filter((x) => x !== d)
            : [...form.daysOfWeek, d].sort();
        set("daysOfWeek", days);
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const body = { ...form, memberId: form.memberId || memberId };
            const { data } = editing
                ? await api.patch(`/api/medications/${value._id}`, body)
                : await api.post("/api/medications", body);
            toast(editing ? "Medication updated" : `${data.medication.name} added — MedMate is watching it now 💊`);
            onSaved?.(data.medication);
        } catch (err) {
            setError(err.friendly);
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

            {members.length > 0 && (
                <label className="block">
                    <span className="text-sm font-bold text-stone-700">Who takes it?</span>
                    <select
                        value={form.memberId} onChange={(e) => set("memberId", e.target.value)} required
                        className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                    >
                        <option value="" disabled>Choose a member…</option>
                        {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                </label>
            )}

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-sm font-bold text-stone-700">Medicine name</span>
                    <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                        placeholder="Metformin 500mg"
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                </label>
                <label className="block">
                    <span className="text-sm font-bold text-stone-700">Dose detail</span>
                    <input value={form.dosage} onChange={(e) => set("dosage", e.target.value)}
                        placeholder="1 tablet after food"
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                </label>
            </div>

            <div>
                <span className="text-sm font-bold text-stone-700">Form</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {FORMS.map((f) => (
                        <button key={f} type="button" onClick={() => set("form", f)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${form.form === f ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <span className="text-sm font-bold text-stone-700">Dose times</span>
                <div className="mt-1.5 space-y-2">
                    {form.doseTimes.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input type="time" value={t} onChange={(e) => toggleTime(i, e.target.value)} required
                                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                            {form.doseTimes.length > 1 && (
                                <button type="button" onClick={() => set("doseTimes", form.doseTimes.filter((_, j) => j !== i))}
                                    className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-500" aria-label="Remove time">
                                    <XIcon size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {form.doseTimes.length < 6 && (
                    <button type="button" onClick={() => set("doseTimes", [...form.doseTimes, "18:00"])}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100">
                        <PlusIcon size={13} /> Add another time
                    </button>
                )}
            </div>

            <div>
                <span className="text-sm font-bold text-stone-700">Days</span>
                <div className="mt-1.5 flex gap-1.5">
                    {DAYS.map((d, idx) => (
                        <button key={d} type="button" onClick={() => toggleDay(idx)}
                            className={`h-9 w-12 rounded-xl text-xs font-bold transition ${form.daysOfWeek.includes(idx) ? "bg-ink text-white" : "bg-stone-100 text-stone-400 hover:bg-stone-200"}`}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="text-sm font-bold text-stone-700">Stock (doses left)</span>
                    <input type="number" min="0" value={form.stockCount} onChange={(e) => set("stockCount", e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                </label>
                <label className="block">
                    <span className="text-sm font-bold text-stone-700">Alert me at</span>
                    <input type="number" min="0" value={form.stockThreshold} onChange={(e) => set("stockThreshold", e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                    <span className="mt-1 block text-[11px] text-stone-400">…when stock falls to this many doses</span>
                </label>
            </div>

            <div className="flex gap-3 pt-1">
                <button type="submit" disabled={busy}
                    className="flex-1 rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-60">
                    {busy ? "Saving…" : editing ? "Save changes" : "Add medication"}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="rounded-xl border border-stone-300 px-5 text-sm font-bold text-stone-600 hover:bg-stone-50">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
