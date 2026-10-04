import { Link } from "react-router-dom";
import ThreeBackground from "../components/ThreeBackground.jsx";
import { PillIcon, BellIcon, AlertIcon, ChartIcon, HeartIcon, CheckIcon, ClockIcon } from "../components/icons.jsx";

const features = [
    {
        icon: BellIcon,
        title: "Doses that speak up",
        body: "Every scheduled dose fires a reminder — on screen and as a browser notification. No pillbox required.",
        hue: "from-brand-500 to-emerald-500",
        soft: "bg-brand-50",
    },
    {
        icon: AlertIcon,
        title: "Silence becomes an alert",
        body: "If a dose isn't confirmed within 60 minutes, every caregiver is notified. Missed doses can't hide.",
        hue: "from-rose-500 to-pink-500",
        soft: "bg-rose-50",
    },
    {
        icon: PillIcon,
        title: "Stock that thinks ahead",
        body: "Each confirmed dose decrements the strip. MedMate warns you before the last tablet — not after it's gone.",
        hue: "from-violet-500 to-fuchsia-500",
        soft: "bg-violet-50",
    },
    {
        icon: ChartIcon,
        title: "Doctor-visit reports",
        body: "30-day adherence heatmaps, per-medicine breakdowns and streaks — printable, ready for the next appointment.",
        hue: "from-amber-500 to-orange-500",
        soft: "bg-amber-50",
    },
];

const steps = [
    { n: "1", title: "Set up your care circle", body: "Create a family, add the people you care for — Mom, Dad, Nani — and their medicines with dose times.", hue: "from-brand-400 to-emerald-400" },
    { n: "2", title: "MedMate takes the watch", body: "The scheduler fires reminders on time, every time, in your family's timezone. Everyone sees the same truth.", hue: "from-violet-400 to-fuchsia-400" },
    { n: "3", title: "Confirm, or get alerted", body: "One tap confirms a dose. Silence escalates to caregivers. Sundays bring a weekly digest you can show the doctor.", hue: "from-amber-400 to-rose-400" },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-paper">
            {/* nav */}
            <header className="fixed inset-x-0 top-0 z-50 glass">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-pop">
                            <PillIcon size={18} />
                        </span>
                        <span className="font-display text-xl font-extrabold tracking-tight">MedMate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-stone-600 transition hover:bg-white/70">
                            Log in
                        </Link>
                        <Link to="/register" className="btn-shine rounded-xl bg-ink px-5 py-2 text-sm font-bold text-white transition hover:bg-stone-700">
                            Get started
                        </Link>
                    </div>
                </div>
            </header>

            {/* hero with live three.js scene */}
            <section className="relative overflow-hidden pt-16">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800" />
                <ThreeBackground density={26} />
                <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_115%,rgba(247,246,242,0.95),transparent_70%)]" />

                <div className="relative mx-auto max-w-6xl px-5 pb-40 pt-20 sm:pt-28">
                    <div className="animate-rise mx-auto max-w-3xl text-center">
                        <p className="inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-xs font-bold text-brand-100">
                            <HeartIcon size={13} className="text-rose-300" />
                            For families separated by cities, united by care
                        </p>
                        <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-7xl">
                            Never miss a dose
                            <br />
                            that{" "}
                            <span className="bg-gradient-to-r from-brand-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                                matters
                            </span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-100/90">
                            Mom forgot her BP tablet again — and you found out three days later.
                            MedMate reminds her on time, and if a dose goes unconfirmed,{" "}
                            <strong className="text-white">you get alerted</strong>. Wherever you are.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                            <Link to="/register" className="btn-shine rounded-2xl bg-gradient-to-r from-brand-400 to-emerald-400 px-8 py-4 text-base font-extrabold text-brand-950 shadow-pop transition hover:brightness-110 active:scale-[0.98]">
                                Create your family circle — free
                            </Link>
                            <Link to="/login" className="rounded-2xl glass-dark px-8 py-4 text-base font-bold text-white transition hover:bg-white/15">
                                Try the demo family →
                            </Link>
                        </div>
                        <p className="mt-5 text-xs font-semibold text-brand-200/70">
                            Demo login: priya@medmate.demo · demo12345
                        </p>
                    </div>
                </div>

                {/* floating demo card */}
                <div className="relative mx-auto -mt-32 w-full max-w-xl px-5 pb-10">
                    <div className="animate-rise space-y-3 rounded-3xl bg-white/85 p-6 shadow-glow ring-1 ring-white/70 backdrop-blur-xl [animation-delay:200ms]">
                        <div className="flex items-center justify-between">
                            <p className="font-display text-sm font-extrabold">Today · Sharma Family</p>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">2 taken</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">💊</span>
                            <div className="flex-1">
                                <p className="text-sm font-extrabold">Metformin 500mg <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">DUE</span></p>
                                <p className="text-xs text-stone-500">Ramesh (Dad) · 1 tablet · after food · 09:00</p>
                            </div>
                            <span className="btn-shine rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-extrabold text-white">Taken ✓</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-xl">🥣</span>
                            <div className="flex-1">
                                <p className="text-sm font-extrabold">Calcium + D3 <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">Taken</span></p>
                                <p className="text-xs text-stone-500">Sunita (Mom) · 14:30 · confirmed by self</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4">
                            <AlertIcon size={18} className="mt-0.5 shrink-0 text-rose-500" />
                            <div>
                                <p className="text-sm font-extrabold text-rose-700">Ramesh (Dad) missed Telmisartan 40mg</p>
                                <p className="text-xs text-rose-500">The 14:00 dose was not confirmed within 60 minutes — caregivers alerted.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* problem strip */}
            <section className="relative">
                <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:grid-cols-3">
                    {[
                        ["~50%", "of chronic medicines are not taken as prescribed, especially by elderly patients living alone", "text-brand-600"],
                        ["#1", "reason families learn of a missed dose: a health scare, not a reminder", "text-rose-500"],
                        ["1 tap", "to close the loop — confirm a dose, and the whole family sees it", "text-violet-600"],
                    ].map(([big, small, tone]) => (
                        <div key={big} className="rounded-3xl border border-stone-100 bg-white p-7 shadow-card">
                            <p className={`font-display text-4xl font-extrabold ${tone}`}>{big}</p>
                            <p className="mt-3 text-sm leading-relaxed text-stone-500">{small}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* features */}
            <section className="mx-auto max-w-6xl px-5 py-16">
                <h2 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                    A companion, <span className="text-gradient">not a chatbot</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-center text-stone-500">
                    Four loops that quietly keep your family safe.
                </p>
                <div className="mt-12 grid gap-5 sm:grid-cols-2">
                    {features.map(({ icon: Icon, title, body, hue, soft }, i) => (
                        <div key={title} className={`animate-rise group rounded-3xl border border-stone-100 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop ${i % 2 ? "ring-gradient" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
                            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${hue} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                <Icon size={21} />
                            </span>
                            <h3 className="mt-4 font-display text-lg font-extrabold">{title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-stone-500">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* how it works */}
            <section className="relative overflow-hidden bg-ink px-5 py-20 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_20%_0%,rgba(20,184,166,0.16),transparent_60%),radial-gradient(36rem_24rem_at_85%_100%,rgba(139,92,246,0.14),transparent_60%)]" />
                <div className="relative mx-auto max-w-6xl">
                    <h2 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Three steps to peace of mind</h2>
                    <div className="mt-14 grid gap-6 md:grid-cols-3">
                        {steps.map((s) => (
                            <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-7 transition hover:border-white/20 hover:bg-white/10">
                                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.hue} font-display text-lg font-extrabold text-white`}>{s.n}</span>
                                <h3 className="mt-4 font-display text-lg font-extrabold">{s.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-stone-300">{s.body}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 text-center">
                        <Link to="/register" className="btn-shine inline-block rounded-2xl bg-gradient-to-r from-brand-400 to-emerald-400 px-10 py-4 text-base font-extrabold text-brand-950 shadow-pop transition hover:brightness-110">
                            Start your family circle
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-10 text-sm text-stone-400 sm:flex-row">
                <span className="flex items-center gap-1.5 font-semibold">MedMate — built with <HeartIcon size={13} className="text-rose-400" /> for families</span>
                <span className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1"><ClockIcon size={13} /> Timezone-aware reminders</span>
                    <span className="inline-flex items-center gap-1"><CheckIcon size={13} /> Private by design</span>
                </span>
            </footer>
        </div>
    );
}
