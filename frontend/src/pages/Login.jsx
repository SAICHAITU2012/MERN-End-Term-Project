import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import ThreeBackground from "../components/ThreeBackground.jsx";
import { PillIcon } from "../components/icons.jsx";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const me = await login(form.email, form.password);
            toast(`Welcome back, ${me?.user?.name?.split(" ")[0]}!`);
            navigate(me?.user?.role === "member" ? "/my-meds" : "/dashboard");
        } catch (err) {
            setError(err.friendly);
        } finally {
            setBusy(false);
        }
    };

    const fillDemo = (email) => setForm({ email, password: "demo12345" });

    return (
        <div className="aurora relative flex min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-ink" />
            <ThreeBackground density={16} className="hidden opacity-60 lg:block" />

            {/* left panel */}
            <div className="relative hidden flex-col justify-between p-10 text-white lg:flex lg:w-[44%]">
                <Link to="/" className="flex w-fit items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-400 text-brand-950 shadow-glow">
                        <PillIcon size={19} />
                    </span>
                    <span className="font-display text-xl font-extrabold">MedMate</span>
                </Link>
                <div>
                    <h2 className="font-display text-4xl font-extrabold leading-tight">
                        Good to see<br />you again.
                    </h2>
                    <p className="mt-5 max-w-sm text-brand-100/85">Your family's doses are being watched — even while you're away from this screen.</p>
                    <div className="mt-9 space-y-3.5">
                        {["Today's doses sync live", "Missed doses escalate to caregivers", "Sunday digest, ready for the doctor"].map((t, i) => (
                            <p
                                key={t}
                                className="animate-rise flex items-center gap-3 text-sm font-semibold text-brand-50/90"
                                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-emerald-400 text-xs text-brand-950">✓</span> {t}
                            </p>
                        ))}
                    </div>
                </div>
                <p className="text-xs font-semibold text-brand-200/50">Private by design · your family's data stays in your family</p>
            </div>

            {/* form */}
            <div className="relative flex flex-1 items-center justify-center px-5 py-12">
                <div className="animate-rise w-full max-w-md rounded-[2rem] bg-white/95 p-8 shadow-glow backdrop-blur-xl sm:p-10">
                    <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white"><PillIcon size={18} /></span>
                        <span className="font-display text-xl font-extrabold">MedMate</span>
                    </Link>
                    <h1 className="font-display text-2xl font-extrabold">Log in to your family circle</h1>
                    <p className="mt-1.5 text-sm text-stone-500">Caregivers and members use the same door.</p>

                    <form onSubmit={submit} className="mt-8 space-y-4">
                        {error && (
                            <div className="animate-pop rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{error}</div>
                        )}
                        <label className="block">
                            <span className="text-sm font-bold text-stone-700">Email</span>
                            <input
                                type="email" required autoComplete="email" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                placeholder="you@example.com"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-stone-700">Password</span>
                            <input
                                type="password" required autoComplete="current-password" value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                placeholder="••••••••"
                            />
                        </label>
                        <button
                            type="submit" disabled={busy}
                            className="btn-shine w-full rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-110 disabled:opacity-60"
                        >
                            {busy ? "Logging in…" : "Log in"}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Demo family logins</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <button onClick={() => fillDemo("priya@medmate.demo")} className="rounded-lg bg-white px-3 py-2 font-bold text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-400">Priya (caregiver)</button>
                            <button onClick={() => fillDemo("ramesh@medmate.demo")} className="rounded-lg bg-white px-3 py-2 font-bold text-stone-700 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-400">Ramesh (member)</button>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-stone-400">Password: demo12345</p>
                    </div>

                    <p className="mt-8 text-center text-sm text-stone-500">
                        New here? <Link to="/register" className="font-extrabold text-brand-700 hover:underline">Create a family circle</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
