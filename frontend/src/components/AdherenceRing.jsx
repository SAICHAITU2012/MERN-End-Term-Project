// circular adherence ring (SVG) — shows percentage 0–100
export default function AdherenceRing({ pct, size = 64, stroke = 7, label }) {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const value = pct == null ? 0 : Math.max(0, Math.min(100, pct));
    const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#f43f5e";
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f5f5f4" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (value / 100) * circ}
                    style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-extrabold leading-none" style={{ fontSize: size * 0.26 }}>
                    {pct == null ? "–" : `${value}%`}
                </span>
                {label && <span className="mt-0.5 text-[10px] font-semibold text-stone-400">{label}</span>}
            </div>
        </div>
    );
}
