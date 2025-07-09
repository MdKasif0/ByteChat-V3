import { format, isToday, isYesterday } from 'date-fns';

export const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
};

export const formatCallTimestamp = (date: Date) => {
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return `Yesterday, ${format(date, 'p')}`;
    return format(date, 'd MMMM, p');
};
