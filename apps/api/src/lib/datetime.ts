const timezoneOffsets: Record<string, string> = {
  'Asia/Taipei': '+08:00',
  'Asia/Hong_Kong': '+08:00',
  'Asia/Tokyo': '+09:00',
  UTC: '+00:00',
};

export function timezoneOffset(timezone: string): string {
  return timezoneOffsets[timezone] ?? '+00:00';
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function dateStringToUtcDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00Z`);
}

export function addDaysToDateString(dateString: string, days: number): string {
  const date = dateStringToUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function listDateStrings(fromDate: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) =>
    addDaysToDateString(fromDate, index),
  );
}

export function dayOfWeekFromDateString(dateString: string): number {
  return dateStringToUtcDate(dateString).getUTCDay();
}

function getFormatterParts(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    ...options,
  }).formatToParts(date);
}

export function formatDateInTimezone(date: Date, timeZone: string): string {
  const parts = getFormatterParts(date, timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatTimeInTimezone(date: Date, timeZone: string): string {
  const parts = getFormatterParts(date, timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('hour')}:${get('minute')}`;
}

export function todayDateInTimezone(timeZone: string): string {
  return formatDateInTimezone(new Date(), timeZone);
}

export function toDateAtBusinessTime(
  dateString: string,
  timeString: string,
  timeZone: string,
): Date {
  return new Date(`${dateString}T${timeString}:00${timezoneOffset(timeZone)}`);
}

export function formatSlotLabel(
  startAt: Date,
  endAt: Date,
  timeZone: string,
): string {
  return `${formatDateInTimezone(startAt, timeZone)} ${formatTimeInTimezone(
    startAt,
    timeZone,
  )} - ${formatTimeInTimezone(endAt, timeZone)}`;
}

export function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}
