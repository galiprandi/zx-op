const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface TimeParts {
  hour: number;
  minute: number;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface OperationalDayRange {
  startUtc: Date;
  endUtc: Date;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function parseOperationalDayStart(value: string): TimeParts {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value);
  if (!match) {
    throw new Error('operationalDayStart must be in HH:mm format');
  }

  const [hourText, minuteText] = value.split(':');
  return {
    hour: Number(hourText),
    minute: Number(minuteText),
  };
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function parseGmtOffsetMinutes(offsetText: string): number {
  if (offsetText === 'GMT' || offsetText === 'UTC') return 0;

  const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(offsetText);
  if (!match) {
    throw new Error(`Unsupported timezone offset format: ${offsetText}`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes);
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const offset = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')?.value;
  if (!offset) {
    throw new Error('Could not determine timezone offset');
  }

  return parseGmtOffsetMinutes(offset);
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  let offset = getOffsetMinutes(new Date(utcGuessMs), timeZone);
  let resultMs = utcGuessMs - offset * 60_000;

  const correctedOffset = getOffsetMinutes(new Date(resultMs), timeZone);
  if (correctedOffset !== offset) {
    resultMs = utcGuessMs - correctedOffset * 60_000;
  }

  return new Date(resultMs);
}

export function getOperationalDayRange(now: Date, timeZone: string, operationalDayStart: string): OperationalDayRange {
  const { hour: startHour, minute: startMinute } = parseOperationalDayStart(operationalDayStart);

  if (!isValidTimeZone(timeZone)) {
    throw new Error('timezone must be a valid IANA timezone');
  }

  const localNow = getZonedParts(now, timeZone);
  const startedToday =
    localNow.hour > startHour || (localNow.hour === startHour && localNow.minute >= startMinute);

  const localStartUtc = zonedDateTimeToUtc(
    localNow.year,
    localNow.month,
    localNow.day,
    startHour,
    startMinute,
    0,
    timeZone,
  );

  const startUtc = startedToday ? localStartUtc : new Date(localStartUtc.getTime() - ONE_DAY_MS);
  const endUtc = new Date(startUtc.getTime() + ONE_DAY_MS);

  return { startUtc, endUtc };
}
