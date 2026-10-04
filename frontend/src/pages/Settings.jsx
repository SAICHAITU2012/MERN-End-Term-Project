import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import { CopyIcon, PlusIcon } from "../components/icons.jsx";

const TIMEZONES = [
    "Asia/Kolkata", "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka", "Asia/Singapore",
    "Asia/Hong_Kong", "Asia/Tokyo", "Australia/Sydney", "Europe/London", "Europe/Paris",
    "Europe/Berlin", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "America/Sao_Paulo", "Africa/Nairobi", "Pacific/Auckland",
];

export default function Settings() {
    const { user, family, refresh, updateUser } = useAuth();
    const toast = useToast();
    const isCaregiver = user.role === "caregiver";

    const [data, setData] = useState(null);
    const [famForm, setFamForm] = useState({ name: "", timezone: "", escalationAfterMin: 60 });
    const [nameForm, setNameForm] = useState(user.name);
    const [newMember, setNewMember] = useState({ name: "", age: "", conditions: "", accountEmail: "", accountPassword: "" });
    const [loginModal, setLoginModal] = useState(null); // member needing a login
    const [creds, setCreds] = useState({ email: "", password: "" });
    const fileRef = useRef(null);

    const load = () =>
        api.get("/api/family").then(({ data }) => {
            setData(data);
            setFamForm({
                name: data.family.name,
                timezone: data.family.timezone,
                escalationAfterMin: data.family.escalationAfterMin || 60,
            });
        });
    useEffect(() => { load(); }, []);

    const saveFamily = async (e) => {
        e.preventDefault();
        try {
            await api.patch("/api/family", famForm);
            await refresh();
            toast("Family settings saved");
        } catch (err) { toast(err.friendly, "error"); }
    };

    const saveName = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.patch("/api/auth/me", { name: nameForm });
            updateUser(data.user);
            toast("Profile updated");
        } catch (err) { toast(err.friendly, "error"); }
    };

    const uploadAvatar = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("avatar", file);
        try {
            const { data } = await api.patch("/api/auth/avatar", fd);
            updateUser(data.user);
            toast("Photo updated");
        } catch (err) { toast(err.friendly, "error"); }
    };

    const addMember = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/family/members", newMember);
            toast(`${newMember.name} added to the care circle`);
            setNewMember({ name: "", age: "", conditions: "", accountEmail: "", accountPassword: "" });
            load();
        } catch (err) { toast(err.friendly, "error"); }
    };

    const createLogin = async () => {
        try {
            await api.post(`/api/family/members/${loginModal._id}/login`, creds);
            toast(`Login created for ${loginModal.name}`);
            setLoginModal(null);
            setCreds({ email: "", password: "" });
            load();
        } catch (err) { toast(err.friendly, "error"); }
    };

    const rotateInvite = async () => {
        await api.post("/api/family/invite/rotate");
        load();
        toast("New invite code generated");
    };

    const memberHasLogin = (memberId) =>
        data?.memberLogins?.some((l) => String(l.linkedMember) === String(memberId));

    return (
        <div className="space-y-6">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* profile */}
                <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-card">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">Your profile</h2>
                    <div className="mt-4 flex items-center gap-4">
                        <button onClick={() => fileRef.current?.click()} className="rounded-full transition hover:opacity-80" title="Change photo">
                            <Avatar name={user.name} src={user.avatar} size={64} />
                        </button>
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadAvatar} />
                        <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-stone-500">{user.email}</p>
                            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-brand-700">{user.role}</p>
                        </div>
                    </div>
                    <form onSubmit={saveName} className="mt-4 flex gap-2">
                        <input value={nameForm} onChange={(e) => setNameForm(e.target.value)} required
                            className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                        <button className="rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-stone-700">Save</button>
                    </form>
                </section>

                {/* family */}
                {isCaregiver && (
                    <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-card">
                        <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">Family & reminders</h2>
                        <form onSubmit={saveFamily} className="mt-4 space-y-3">
                            <label className="block">
                                <span className="text-sm font-bold text-stone-700">Family name</span>
                                <input value={famForm.name} onChange={(e) => setFamForm({ ...famForm, name: e.target.value })} required
                                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-stone-700">Timezone (reminders fire here)</span>
                                <select value={famForm.timezone} onChange={(e) => setFamForm({ ...famForm, timezone: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100">
                                    {[...new Set([famForm.timezone, ...TIMEZONES])].map((tz) => <option key={tz}>{tz}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-stone-700">Escalation window (minutes)</span>
                                <input type="number" min="5" max="720" value={famForm.escalationAfterMin}
                                    onChange={(e) => setFamForm({ ...famForm, escalationAfterMin: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100" />
                                <span className="mt-1 block text-[11px] text-stone-400">If a dose isn't confirmed in this window, all caregivers are alerted.</span>
                            </label>
                            <button className="w-full rounded-xl bg-ink py-3 text-sm font-bold text-white hover:bg-stone-700">Save family settings</button>
                        </form>
                    </section>
                )}

                {/* invite + members */}
                {isCaregiver && (
                    <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-card lg:col-span-2">
                        <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-400">Care circle</h2>

                        <div className="mt-4 grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-bold">Members (people being cared for)</p>
                                <div className="mt-2 space-y-2">
                                    {data?.members?.map((m) => (
                                        <div key={m._id} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3">
                                            <Avatar name={m.name} src={m.avatar} size={36} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold">{m.name}</p>
                                                <p className="text-xs text-stone-400">
                                                    {m.age ? `${m.age} yrs · ` : ""}{memberHasLogin(m._id) ? "has app login" : "no app login"}
                                                </p>
                                            </div>
                                            {!memberHasLogin(m._id) && (
                                                <button onClick={() => setLoginModal(m)}
                                                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100">
                                                    <PlusIcon size={12} className="mr-1 inline" /> Login
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {data && data.members.length === 0 && <p className="text-sm text-stone-400">No members yet.</p>}
                                </div>

                                <p className="mt-5 text-sm font-bold">Add a member</p>
                                <form onSubmit={addMember} className="mt-2 space-y-2.5 rounded-2xl bg-stone-50 p-4">
                                    <input required placeholder="Name (e.g. Nani)" value={newMember.name}
                                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600" />
                                    <input type="number" min="0" max="130" placeholder="Age" value={newMember.age}
                                        onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600" />
                                    <input placeholder="Conditions (optional)" value={newMember.conditions}
                                        onChange={(e) => setNewMember({ ...newMember, conditions: e.target.value })}
                                        className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600" />
                                    <details className="text-xs text-stone-500">
                                        <summary className="cursor-pointer font-bold">Give them their own app login (optional)</summary>
                                        <input type="email" placeholder="Their email" value={newMember.accountEmail}
                                            onChange={(e) => setNewMember({ ...newMember, accountEmail: e.target.value })}
                                            className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600" />
                                        <input placeholder="Initial password (min 8 chars)" value={newMember.accountPassword}
                                            onChange={(e) => setNewMember({ ...newMember, accountPassword: e.target.value })}
                                            className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600" />
                                    </details>
                                    <button className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Add member</button>
                                </form>
                            </div>

                            <div>
                                <p className="text-sm font-bold">Caregivers (people who watch over)</p>
                                <div className="mt-2 space-y-2">
                                    {data?.caregivers?.map((c) => (
                                        <div key={c.email} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3">
                                            <Avatar name={c.name} src={c.avatar} size={36} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold">{c.name}</p>
                                                <p className="truncate text-xs text-stone-400">{c.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="mt-5 text-sm font-bold">Invite another caregiver</p>
                                <div className="mt-2 flex items-center gap-2 rounded-2xl bg-stone-50 p-4">
                                    <code className="flex-1 truncate rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold tracking-widest text-brand-800 shadow-sm">
                                        {data?.family?.inviteCode || "…"}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(data.family.inviteCode);
                                            toast("Invite code copied");
                                        }}
                                        className="rounded-xl bg-ink p-3 text-white hover:bg-stone-700" title="Copy code"
                                    >
                                        <CopyIcon size={16} />
                                    </button>
                                    <button onClick={rotateInvite} className="text-xs font-bold text-stone-400 hover:text-rose-500">rotate</button>
                                </div>
                                <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
                                    Share this code — a caregiver signs up with "Join with invite code" and instantly sees every member's schedule.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* create member login modal */}
            <Modal open={Boolean(loginModal)} onClose={() => setLoginModal(null)} title={`App login for ${loginModal?.name || ""}`}>
                <p className="text-sm text-stone-500">
                    They'll log in on their own phone and see a simple "My Medicines" screen with big buttons — and their confirmations update your dashboard live.
                </p>
                <div className="mt-4 space-y-3">
                    <input type="email" required placeholder="Their email" value={creds.email}
                        onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600" />
                    <input required minLength={8} placeholder="Password (min 8 chars)" value={creds.password}
                        onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                        className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-600" />
                    <button onClick={createLogin} className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-bold text-white shadow-pop hover:bg-brand-700">
                        Create login
                    </button>
                </div>
            </Modal>
        </div>
    );
}
