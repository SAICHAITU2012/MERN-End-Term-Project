import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
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
        <div className="flex min-h-screen">
            <div className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex lg:w-[42%]">
                <Link to="/" className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500"><PillIcon size={18} /></span>
                    <span className="text-xl font-extrabold">MedMate</span>
                </Link>
                <div>
                    <h2 className="text-3xl font-extrabold leading-tight">One circle. Every dose covered.</h2>
                    <p className="mt-4 max-w-sm text-stone-300">
                        Create a family, add the people you care for and their medicines. MedMate watches the clock so you can watch over them — from any city.
                    </p>
                </div>
                <p className="text-xs text-stone-500">Passwords are hashed · sessions are httpOnly cookies · no data leaves your family</p>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-12">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-extrabold">Create your account</h1>
                    <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
                        {[
                            ["create", "Start a new family"],
                            ["join", "Join with invite code"],
                        ].map(([m, label]) => (
                            <button
                                key={m} type="button" onClick={() => setMode(m)}
                                className={`rounded-lg py-2 text-sm font-bold transition ${mode === m ? "bg-white shadow-sm text-ink" : "text-stone-500"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

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
                                        className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                                    >
                                        {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
                                    </select>
                                    <span className="mt-1 block text-[11px] text-stone-400">Reminders fire in this timezone — where your family lives.</span>
                                </label>
                            </>
                        ) : (
                            <Field label="Invite code" value={form.inviteCode} onChange={set("inviteCode")} placeholder="e.g. 7FA2C1" required />
                        )}

                        <button type="submit" disabled={busy}
                            className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-60">
                            {busy ? "Creating…" : mode === "join" ? "Join family" : "Create account"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-stone-500">
                        Already have an account? <Link to="/login" className="font-bold text-brand-700 hover:underline">Log in</Link>
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
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
        </label>
    );
}
