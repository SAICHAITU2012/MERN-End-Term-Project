import { Link } from "react-router-dom";
import { PillIcon, BellIcon, AlertIcon, ChartIcon, HeartIcon, CheckIcon, ClockIcon } from "../components/icons.jsx";

const features = [
    {
        icon: BellIcon,
        title: "Doses that speak up",
        body: "Every scheduled dose fires a reminder — on screen and as a browser notification. No pillbox required.",
    },
    {
        icon: AlertIcon,
        title: "Silence becomes an alert",
        body: "If a dose isn't confirmed within 60 minutes, every caregiver in the family is notified. Missed doses can't hide.",
    },
    {
        icon: PillIcon,
        title: "Stock that thinks ahead",
        body: "Each confirmed dose decrements the strip. MedMate warns you before the last tablet — not after it's gone.",
    },
    {
        icon: ChartIcon,
        title: "Doctor-visit reports",
        body: "30-day adherence heatmaps, per-medicine breakdowns and streaks — printable, ready for the next appointment.",
    },
];

const steps = [
    { n: "1", title: "Set up your care circle", body: "Create a family, add the people you care for — Mom, Dad, Nani — and their medicines with dose times." },
    { n: "2", title: "MedMate takes the watch", body: "The scheduler fires reminders on time, every time, in your family's timezone. Everyone sees the same truth." },
    { n: "3", title: "Confirm, or get alerted", body: "One tap confirms a dose. Silence escalates to caregivers. Sundays bring a weekly digest you can show the doctor." },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-paper">
            {/* nav */}
            <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                        <PillIcon size={18} />
                    </span>
                    <span className="text-xl font-extrabold tracking-tight">MedMate</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100">
                        Log in
                    </Link>
                    <Link to="/register" className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-700">
                        Get started
                    </Link>
                </div>
            </header>

            {/* hero */}
            <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
                <div className="grid items-center gap-14 lg:grid-cols-2">
                    <div className="animate-rise">
                        <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold text-brand-800">
                            <HeartIcon size={13} /> For families separated by cities, united by care
                        </p>
                        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
                            Never miss a dose that{" "}
                            <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
                                matters
                            </span>
                        </h1>
                        <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
                            Mom forgot her BP tablet again — and you found out three days later. MedMate reminds her on time,
                            and if a dose goes unconfirmed, <strong className="text-ink">you get alerted</strong>. Wherever you are.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link to="/register" className="rounded-2xl bg-brand-600 px-7 py-3.5 text-base font-bold text-white shadow-pop transition hover:bg-brand-700 active:scale-[0.98]">
                                Create your family circle — free
                            </Link>
                            <Link to="/login" className="rounded-2xl border border-stone-300 bg-white px-7 py-3.5 text-base font-bold text-stone-700 transition hover:border-stone-400">
                                Try the demo family →
                            </Link>
                        </div>
                        <p className="mt-4 text-xs text-stone-400">
                            Demo login: priya@medmate.demo · demo12345
                        </p>
                    </div>

                    {/* hero mock — the "due now" card */}
                    <div className="animate-rise relative mx-auto w-full max-w-md [animation-delay:120ms]">
                        <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-200/60 via-transparent to-amber-100/70 blur-2xl" />
                        <div className="relative space-y-3 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-pop">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-extrabold">Today · Sharma Family</p>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">2 taken</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">💊</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Metformin 500mg <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">DUE</span></p>
                                    <p className="text-xs text-stone-500">Ramesh (Dad) · 1 tablet · after food · 09:00</p>
                                </div>
                                <span className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Taken ✓</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-xl">🥣</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Calcium + D3 <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Taken</span></p>
                                    <p className="text-xs text-stone-500">Sunita (Mom) · 14:30 · confirmed by self</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <AlertIcon size={18} className="mt-0.5 shrink-0 text-rose-500" />
                                <div>
                                    <p className="text-sm font-bold text-rose-700">Ramesh (Dad) missed Telmisartan 40mg</p>
                                    <p className="text-xs text-rose-500">The 14:00 dose was not confirmed within 60 minutes — caregivers alerted.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* problem strip */}
            <section className="border-y border-stone-200/70 bg-white">
                <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
                    {[
                        ["~50%", "of chronic medicines are not taken as prescribed, especially by elderly patients living alone"],
                        ["#1", "reason families find out about a missed dose: a health scare, not a reminder"],
                        ["1 tap", "is all it takes to close the loop — confirm a dose, and the whole family sees it"],
                    ].map(([big, small]) => (
                        <div key={big} className="text-center sm:text-left">
                            <p className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-3xl font-extrabold text-transparent">{big}</p>
                            <p className="mt-2 text-sm leading-relaxed text-stone-500">{small}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* features */}
            <section className="mx-auto max-w-6xl px-5 py-20">
                <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">A companion, not a chatbot</h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-stone-500">
                    Four loops that quietly keep your family safe.
                </p>
                <div className="mt-12 grid gap-5 sm:grid-cols-2">
                    {features.map(({ icon: Icon, title, body }, i) => (
                        <div key={title} className="animate-rise rounded-3xl border border-stone-100 bg-white p-7 shadow-card" style={{ animationDelay: `${i * 90}ms` }}>
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
                                <Icon size={20} />
                            </span>
                            <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-stone-500">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* how it works */}
            <section className="bg-ink px-5 py-20 text-white">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps to peace of mind</h2>
                    <div className="mt-12 grid gap-8 md:grid-cols-3">
                        {steps.map((s) => (
                            <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 font-extrabold">{s.n}</span>
                                <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-stone-300">{s.body}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-14 text-center">
                        <Link to="/register" className="inline-block rounded-2xl bg-brand-500 px-8 py-4 text-base font-bold text-white transition hover:bg-brand-400">
                            Start your family circle
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-10 text-sm text-stone-400 sm:flex-row">
                <span className="flex items-center gap-1.5">MedMate — built with <HeartIcon size={13} className="text-rose-400" /> for families</span>
                <span className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1"><ClockIcon size={13} /> Timezone-aware reminders</span>
                    <span className="inline-flex items-center gap-1"><CheckIcon size={13} /> Private by design</span>
                </span>
            </footer>
        </div>
    );
}
