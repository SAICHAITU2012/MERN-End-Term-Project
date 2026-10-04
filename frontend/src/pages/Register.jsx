import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import ThreeBackground from "../components/ThreeBackground.jsx";
import { PillIcon } from "../components/icons.jsx";

const TIMEZONES = [
    "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
    "Europe/London", "Europe/Berlin", "America/New_York", "America/Chicago",
    "America/Los_Angeles", "Australia/Sydney", "Pacific/Auckland",
];

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [mode, setMode] = useState("create"); // create | join
    const [form, setForm] = useState({
        name: "", email: "", password: "",
        familyName: "", timezone: "Asia/Kolkata", inviteCode: "",
    });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const payload =
                mode === "join"
                    ? { name: form.name, email: form.email, password: form.password, inviteCode: form.inviteCode }
                    : form;
            await register(payload);
            toast("Welcome to MedMate! 💊");
            navigate("/onboarding");
        } catch (err) {
            setError(err.friendly);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="aurora relative flex min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-br from-ink via-brand-950 to-brand-900" />
            <ThreeBackground density={16} className="hidden opacity-60 lg:block" />

            <div className="relative hidden flex-col justify-between p-10 text-white lg:flex lg:w-[44%]">
                <Link to="/" className="flex w-fit items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-400 text-brand-950 shadow-glow">
                        <PillIcon size={19} />
                    </span>
                    <span className="font-display text-xl font-extrabold">MedMate</span>
                </Link>
                <div>
                    <h2 className="font-display text-4xl font-extrabold leading-tight">One circle.<br />Every dose covered.</h2>
                    <p className="mt-5 max-w-sm text-brand-100/85">
                        Create a family, add the people you care for and their medicines. MedMate watches the clock so you can watch over them — from any city.
                    </p>
                </div>
                <p className="text-xs font-semibold text-brand-200/50">Passwords are hashed · sessions are httpOnly cookies · no data leaves your family</p>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-5 py-12">
                <div className="animate-rise w-full max-w-md rounded-[2rem] bg-white/95 p-8 shadow-glow backdrop-blur-xl sm:p-10">
                    <h1 className="font-display text-2xl font-extrabold">Create your account</h1>
                    <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
                        {[
                            ["create", "Start a new family"],
                            ["join", "Join with invite code"],
                        ].map(([m, label]) => (
                            <button
                                key={m} type="button" onClick={() => setMode(m)}
                                className={`rounded-xl py-2 text-sm font-bold transition ${mode === m ? "bg-white text-ink shadow-sm ring-1 ring-stone-200" : "text-stone-500"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        {error && <div className="animate-pop rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{error}</div>}

                        <Field label="Your name" value={form.name} onChange={set("name")} placeholder="Priya Sharma" required />
                        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
                        <Field label="Password (min 8 characters)" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required minLength={8} />

                        {mode === "create" ? (
                            <>
                                <Field label="Family name" value={form.familyName} onChange={set("familyName")} placeholder="Sharma Family" required />
                                <label className="block">
                                    <span className="text-sm font-bold text-stone-700">Your timezone</span>
                                    <select
                                        value={form.timezone} onChange={set("timezone")}
                                        className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                                    >
                                        {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
                                    </select>
                                    <span className="mt-1 block text-[11px] font-semibold text-stone-400">Reminders fire in this timezone — where your family lives.</span>
                                </label>
                            </>
                        ) : (
                            <Field label="Invite code" value={form.inviteCode} onChange={set("inviteCode")} placeholder="e.g. 7FA2C1" required />
                        )}

                        <button type="submit" disabled={busy}
                            className="btn-shine w-full rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-pop transition hover:brightness-110 disabled:opacity-60">
                            {busy ? "Creating…" : mode === "join" ? "Join family" : "Create account"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-stone-500">
                        Already have an account? <Link to="/login" className="font-extrabold text-brand-700 hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, type = "text", value, onChange, placeholder, required, minLength }) {
    return (
        <label className="block">
            <span className="text-sm font-bold text-stone-700">{label}</span>
            <input
                type={type} value={value} onChange={onChange} placeholder={placeholder}
                required={required} minLength={minLength} autoComplete="off"
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
        </label>
    );
}
