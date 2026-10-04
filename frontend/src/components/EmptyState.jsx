export default function EmptyState({ emoji = "🌤️", title, body, action }) {
    return (
        <div className="animate-rise flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <span className="text-4xl">{emoji}</span>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            {body && <p className="mt-1 max-w-sm text-sm text-stone-500">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
