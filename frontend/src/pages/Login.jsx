import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
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
        <div className="flex min-h-screen">
            {/* left panel */}
            <div className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex lg:w-[42%]">
                <Link to="/" className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500"><PillIcon size={18} /></span>
                    <span className="text-xl font-extrabold">MedMate</span>
                </Link>
                <div>
                    <h2 className="text-3xl font-extrabold leading-tight">Good to see you again.</h2>
                    <p className="mt-4 max-w-sm text-stone-300">Your family's doses are being watched — even while you're away from this screen.</p>
                    <div className="mt-8 space-y-3">
                        {["Today's doses sync live", "Missed doses escalate to caregivers", "Sunday digest, ready for the doctor"].map((t) => (
                            <p key={t} className="flex items-center gap-3 text-sm text-stone-300">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">✓</span> {t}
                            </p>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-stone-500">Private by design · your family's data stays in your family</p>
            </div>

            {/* form */}
            <div className="flex flex-1 items-center justify-center px-5 py-12">
                <div className="w-full max-w-md">
                    <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><PillIcon size={18} /></span>
                        <span className="text-xl font-extrabold">MedMate</span>
                    </Link>
                    <h1 className="text-2xl font-extrabold">Log in to your family circle</h1>
                    <p className="mt-1.5 text-sm text-stone-500">Caregivers and members use the same door.</p>

                    <form onSubmit={submit} className="mt-8 space-y-4">
                        {error && (
                            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
                        )}
                        <label className="block">
                            <span className="text-sm font-bold text-stone-700">Email</span>
                            <input
                                type="email" required autoComplete="email" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                                placeholder="you@example.com"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-bold text-stone-700">Password</span>
                            <input
                                type="password" required autoComplete="current-password" value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                                placeholder="••••••••"
                            />
                        </label>
                        <button
                            type="submit" disabled={busy}
                            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-60"
                        >
                            {busy ? "Logging in…" : "Log in"}
                        </button>
                    </form>

                    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Demo family logins</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <button onClick={() => fillDemo("priya@medmate.demo")} className="rounded-lg bg-stone-100 px-3 py-2 font-semibold hover:bg-stone-200">Priya (caregiver)</button>
                            <button onClick={() => fillDemo("ramesh@medmate.demo")} className="rounded-lg bg-stone-100 px-3 py-2 font-semibold hover:bg-stone-200">Ramesh (member)</button>
                        </div>
                        <p className="mt-2 text-[11px] text-stone-400">Password: demo12345</p>
                    </div>

                    <p className="mt-8 text-center text-sm text-stone-500">
                        New here? <Link to="/register" className="font-bold text-brand-700 hover:underline">Create a family circle</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
