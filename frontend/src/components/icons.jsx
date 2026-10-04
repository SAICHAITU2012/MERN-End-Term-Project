// tiny inline icon set — no icon library dependency
const I = ({ children, size = 20, className = "", ...rest }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...rest}
    >
        {children}
    </svg>
);

export const PillIcon = (p) => (
    <I {...p}>
        <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" />
        <path d="m8.5 8.5 7 7" />
    </I>
);
export const BellIcon = (p) => (
    <I {...p}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </I>
);
export const CheckIcon = (p) => (
    <I {...p}>
        <path d="M20 6 9 17l-5-5" />
    </I>
);
export const XIcon = (p) => (
    <I {...p}>
        <path d="M18 6 6 18M6 6l12 12" />
    </I>
);
export const ClockIcon = (p) => (
    <I {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </I>
);
export const UsersIcon = (p) => (
    <I {...p}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </I>
);
export const ChartIcon = (p) => (
    <I {...p}>
        <path d="M3 3v18h18" />
        <path d="m7 13 4-4 4 4 5-6" />
    </I>
);
export const HomeIcon = (p) => (
    <I {...p}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M9 22V12h6v10" />
    </I>
);
export const CalendarIcon = (p) => (
    <I {...p}>
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
    </I>
);
export const SettingsIcon = (p) => (
    <I {...p}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </I>
);
export const PlusIcon = (p) => (
    <I {...p}>
        <path d="M5 12h14M12 5v14" />
    </I>
);
export const SnoozeIcon = (p) => (
    <I {...p}>
        <path d="M8 2h8l-8 8h8" />
        <circle cx="16" cy="17" r="5" />
    </I>
);
export const AlertIcon = (p) => (
    <I {...p}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4M12 17h.01" />
    </I>
);
export const LogoutIcon = (p) => (
    <I {...p}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
    </I>
);
export const HeartIcon = (p) => (
    <I {...p}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </I>
);
export const MenuIcon = (p) => (
    <I {...p}>
        <path d="M4 6h16M4 12h16M4 18h16" />
    </I>
);
export const ClipboardIcon = (p) => (
    <I {...p}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
    </I>
);
export const CopyIcon = (p) => (
    <I {...p}>
        <rect width="14" height="14" x="8" y="8" rx="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </I>
);
