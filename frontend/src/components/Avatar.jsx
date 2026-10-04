export default function Avatar({ name, src, size = 40, ring = false }) {
    const initials = (name || "?")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const palette = ["bg-teal-100 text-teal-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-800"];
    const color = palette[(name || "?").length % palette.length];
    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-full ${color} ${
                ring ? "ring-2 ring-white shadow-sm" : ""
            } flex items-center justify-center font-bold`}
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {src ? (
                <img
                    src={src.startsWith("http") ? src : `${import.meta.env.VITE_API_URL || ""}${src}`}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            ) : (
                initials
            )}
        </div>
    );
}
