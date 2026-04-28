export const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatLocalTime = (date: Date | null | undefined) => {
    if (!date) {
        return '—';
    }

    const h = String(date.getUTCHours()).padStart(2, '0');
    const m = String(date.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

export const formatMarathiDate = (date: Date) => {
    return date.toLocaleDateString('mr-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });
};

export const formatMarathiWeekdayShort = (date: Date) => {
    return date.toLocaleDateString('mr-IN', {
        weekday: 'short'
    });
};

export const formatMarathiMonthYear = (date: Date) => {
    return date.toLocaleDateString('mr-IN', {
        month: 'long',
        year: 'numeric'
    });
};

export const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(date.getDate() + days);
    return next;
};

export const isSameDay = (left: Date, right: Date) => {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
};

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
