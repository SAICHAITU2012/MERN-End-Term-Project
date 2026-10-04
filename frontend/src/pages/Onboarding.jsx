import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import MedForm from "../components/MedForm.jsx";
import { PillIcon } from "../components/icons.jsx";

// first-run wizard: add first member → first medication → done
export default function Onboarding() {
    const { refresh, family } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [member, setMember] = useState({ name: "", age: "", gender: "", conditions: "", notes: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [createdMember, setCreatedMember] = useState(null);

    const submitMember = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const { data } = await api.post("/api/family/members", member);
            setCreatedMember(data.member);
            setStep(2);
        } catch (err) {
            setError(err.friendly);
        } finally {
            setBusy(false);
        }
    };

    const finish = async (skip = false) => {
        await refresh();
        if (skip) toast("You can add medications anytime from the Medications page");
        navigate("/dashboard");
    };

    return (
        <div className="flex min-h-screen flex-col bg-paper">
            <header className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><PillIcon size={18} /></span>
                <span className="text-lg font-extrabold">MedMate</span>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
                {/* progress */}
                <div className="mb-8 flex items-center gap-3">
                    {["Add a family member", "Add their first medication", "You're set"].map((label, i) => (
                        <div key={label} className="flex flex-1 flex-col gap-2">
                            <div className={`h-1.5 rounded-full transition-all ${step > i ? "bg-brand-600" : "bg-stone-200"}`} />
                            <span className={`text-xs font-bold ${step > i ? "text-brand-700" : "text-stone-400"}`}>{label}</span>
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="animate-rise rounded-3xl border border-stone-100 bg-white p-7 shadow-card sm:p-9">
                        <h1 className="text-2xl font-extrabold">Who are you caring for?</h1>
                        <p className="mt-1.5 text-sm text-stone-500">
                            Add the person whose medicines MedMate will watch over. You can add more family members later.
                        </p>
                        <form onSubmit={submitMember} className="mt-6 space-y-4">
                            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <label className="block sm:col-span-2">
                                    <span className="text-sm font-bold text-stone-700">Name</span>
                                    <input required value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })}
                                        placeholder="Ramesh (Dad)"
                                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-stone-700">Age</span>
                                    <input type="number" min="0" max="130" value={member.age} onChange={(e) => setMember({ ...member, age: e.target.value })}
                                        placeholder="68"
                                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-sm font-bold text-stone-700">Health conditions (optional)</span>
                                <input value={member.conditions} onChange={(e) => setMember({ ...member, conditions: e.target.value })}
                                    placeholder="Type 2 diabetes, hypertension…"
                                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                            </label>
                            <button disabled={busy}
                                className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-60">
                                {busy ? "Adding…" : "Continue →"}
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-rise rounded-3xl border border-stone-100 bg-white p-7 shadow-card sm:p-9">
                        <h1 className="text-2xl font-extrabold">{createdMember?.name}'s first medication</h1>
                        <p className="mt-1.5 text-sm text-stone-500">
                            Set the dose times — MedMate will fire reminders exactly on schedule in {family?.timezone?.replace("_", " ")}.
                        </p>
                        <div className="mt-6">
                            <MedForm memberId={createdMember?._id} onSaved={() => setStep(3)} />
                        </div>
                        <button onClick={() => finish(true)} className="mt-4 w-full text-center text-xs font-bold text-stone-400 hover:text-stone-600">
                            Skip for now — set up later
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-rise rounded-3xl border border-brand-100 bg-white p-9 text-center shadow-card">
                        <span className="text-5xl">🎉</span>
                        <h1 className="mt-4 text-2xl font-extrabold">Your care circle is live!</h1>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
                            MedMate now reminds <strong>{createdMember?.name}</strong> on schedule, alerts you if a dose goes
                            unconfirmed, and tracks the medicine stock. Check the dashboard — today's doses are already queued up.
                        </p>
                        <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-left text-sm text-brand-900">
                            <p className="font-bold">💡 Tip for the demo:</p>
                            <p className="mt-1">Enable browser notifications when prompted, so dose reminders pop up even in another tab.</p>
                        </div>
                        <button onClick={() => finish()}
                            className="mt-7 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700 sm:w-auto sm:px-10">
                            Go to my dashboard →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
