import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import MedForm from "../components/MedForm.jsx";
import Modal from "../components/Modal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Avatar from "../components/Avatar.jsx";
import { PlusIcon, PillIcon, AlertIcon } from "../components/icons.jsx";

const FORM_EMOJI = { tablet: "💊", capsule: "💊", syrup: "🥣", injection: "💉", drops: "💧", inhaler: "🌬️", other: "🩺" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Medications() {
    const { user } = useAuth();
    const [meds, setMeds] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // {mode:'add'} | {mode:'edit', med}
    const [refillTarget, setRefillTarget] = useState(null);
    const [refillQty, setRefillQty] = useState(30);

    const load = () => {
        Promise.all([
            api.get("/api/medications"),
            api.get("/api/family"),
        ])
            .then(([m, f]) => {
                setMeds(m.data.medications);
                setMembers(f.data.members);
            })
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const isCaregiver = user.role === "caregiver";

    const refill = async () => {
        try {
            const med = refillTarget;
            await api.patch(`/api/medications/${med._id}`, { stockCount: med.stockCount + Number(refillQty) });
            setModal(null);
            load();
        } catch {}
    };

    const stop = async (med) => {
        if (!confirm(`Stop tracking "${med.name}"? Its future doses will be cancelled.`)) return;
        await api.delete(`/api/medications/${med._id}`);
        load();
    };

    const resume = async (med) => {
        await api.patch(`/api/medications/${med._id}`, { active: true });
        load();
    };

    const active = meds.filter((m) => m.active);
    const stopped = meds.filter((m) => !m.active);

    return (
        <div className="animate-rise space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Medications</h1>
                    <p className="mt-1 text-sm text-stone-500">{active.length} active · MedMate reminds, tracks stock and escalates misses</p>
                </div>
                {isCaregiver && members.length > 0 && (
                    <button onClick={() => setModal({ mode: "add" })}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700">
                        <PlusIcon size={16} /> Add medication
                    </button>
                )}
            </div>

            {loading && <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-stone-100" />)}</div>}

            {!loading && meds.length === 0 && (
                <EmptyState
                    emoji="💊"
                    title="No medications yet"
                    body="Add the first medicine with its dose times — MedMate starts watching the clock, the stock and the confirmations."
                    action={isCaregiver && <button onClick={() => setModal({ mode: "add" })} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white">Add medication</button>}
                />
            )}

            <div className="grid gap-3 lg:grid-cols-2">
                {active.map((med) => {
                    const low = med.stockCount <= med.stockThreshold;
                    return (
                        <div key={med._id} className="rounded-3xl border border-stone-100 bg-white p-5 shadow-card">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-xl">{FORM_EMOJI[med.form] || "💊"}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-bold">{med.name}</p>
                                            <p className="text-sm text-stone-500">{med.dosage || "1 dose"}</p>
                                        </div>
                                        {low && (
                                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                                <AlertIcon size={12} /> Refill
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {med.doseTimes.map((t) => (
                                            <span key={t} className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-stone-600">🕐 {t}</span>
                                        ))}
                                        {med.daysOfWeek?.length < 7 && (
                                            <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                                                {med.daysOfWeek.map((d) => DAYS[d]).join(" ")}
                                            </span>
                                        )}
                                    </div>
                                    {med.instructions && <p className="mt-2 text-xs italic text-stone-400">"{med.instructions}"</p>}
                                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={med.member?.name} src={med.member?.avatar} size={24} />
                                            <span className="text-xs font-bold text-stone-600">{med.member?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <span className={low ? "text-rose-600" : "text-stone-500"}>📦 {med.stockCount} doses</span>
                                            {isCaregiver && (
                                                <button
                                                    onClick={() => { setRefillTarget(med); setRefillQty(30); setModal({ mode: "refill" }); }}
                                                    className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-700 hover:bg-brand-100"
                                                >
                                                    Refill
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {isCaregiver && (
                                <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                                    <button onClick={() => setModal({ mode: "edit", med })} className="rounded-lg bg-stone-100 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200">Edit</button>
                                    <button onClick={() => stop(med)} className="rounded-lg px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50">Stop</button>
                                    <Link to={`/members/${med.member?._id}`} className="ml-auto self-center text-xs font-bold text-brand-700 hover:underline">History →</Link>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {stopped.length > 0 && (
                <section>
                    <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-stone-400">Stopped</h2>
                    <div className="grid gap-3 lg:grid-cols-2">
                        {stopped.map((med) => (
                            <div key={med._id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-4 opacity-75">
                                <span className="text-lg">{FORM_EMOJI[med.form] || "💊"}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-stone-500">{med.name}</p>
                                    <p className="text-xs text-stone-400">{med.member?.name}</p>
                                </div>
                                {isCaregiver && (
                                    <button onClick={() => resume(med)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm hover:bg-brand-50">Resume</button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* add / edit modal */}
            <Modal open={modal?.mode === "add" || modal?.mode === "edit"} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit medication" : "Add medication"} wide>
                {(modal?.mode === "add" || modal?.mode === "edit") && (
                    <MedForm
                        members={members}
                        value={modal?.med}
                        onCancel={() => setModal(null)}
                        onSaved={() => { setModal(null); load(); }}
                    />
                )}
            </Modal>

            {/* refill modal */}
            <Modal open={modal?.mode === "refill"} onClose={() => setModal(null)} title={`Refill ${refillTarget?.name || ""}`}>
                <p className="text-sm text-stone-500">
                    Currently <strong className="text-ink">{refillTarget?.stockCount} doses</strong> left for {refillTarget?.member?.name}. How many doses are you adding?
                </p>
                <div className="mt-4 flex gap-2">
                    {[10, 15, 30, 60].map((q) => (
                        <button key={q} onClick={() => setRefillQty(q)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${refillQty === q ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                            +{q}
                        </button>
                    ))}
                </div>
                <button onClick={refill} className="mt-5 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop hover:bg-brand-700">
                    Add {refillQty} doses
                </button>
            </Modal>
        </div>
    );
}
