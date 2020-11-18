/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Inject,
  inject,
  Injectable,
  InjectionToken,
  LOCALE_ID,
  Optional,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
// import { DtNativeDateAdapter } from './native-date-adapter';

/** The default day of the week names to use if Intl API is not available. */
const DEFAULT_DAY_OF_WEEK_NAMES = {
  long: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const DEFAULT_DATE_NAMES = fillArray(31, (i) => String(i + 1));

/** InjectionToken for datepicker that can be used to override default locale code. */
export const DT_DATE_LOCALE = new InjectionToken<string>('DT_DATE_LOCALE', {
  providedIn: 'root',
  factory: DT_DATE_LOCALE_FACTORY,
});

let SUPPORTS_INTL_API: boolean;
try {
  SUPPORTS_INTL_API = typeof Intl != 'undefined';
} catch {
  SUPPORTS_INTL_API = false;
}

/** @docs-private */
export function DT_DATE_LOCALE_FACTORY(): string {
  return inject(LOCALE_ID);
}

/**
 * Simple version of the Angular Material's NativeDateAdapter.
 * This class can be replaced by Angular's adapter if it is moved to the CDK.
 */
@Injectable()
export class DtNativeDateAdapter implements DtDateAdapter<Date> {
  constructor(
    @Optional() @Inject(DT_DATE_LOCALE) dtDateLocale?: string,
    @Optional() @Inject(LOCALE_ID) locale?: string,
  ) {}
  locale: any;
  get localeChanges(): Observable<void> {
    throw new Error('Method not implemented.');
  }
  _localeChanges: Subject<void>;
  setLocale(locale: any): void {
    throw new Error('Method not implemented.');
  }
  compareDate(first: Date, second: Date): number {
    throw new Error('Method not implemented.');
  }
  clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
    throw new Error('Method not implemented.');
  }

  createDate(year: number, month: number, date: number): Date {
    if (month < 0 || month > 11) {
      throw Error(
        `Invalid month index "${month}". Month index has to be between 0 and 11.`,
      );
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }

    const result = createDateWithOverflow(year, month, date);

    if (result.getMonth() != month) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result;
  }

  today(): Date {
    return new Date();
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getFirstDayOfWeek(): number {
    return 1; // Monday
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return DEFAULT_DAY_OF_WEEK_NAMES[style];
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(
      createDateWithOverflow(this.getYear(date), this.getMonth(date) + 1, 0),
    );
  }

  getDateNames(): string[] {
    if (SUPPORTS_INTL_API) {
      const dtf = new Intl.DateTimeFormat('en_EN', {
        day: 'numeric',
        timeZone: 'utc',
      });
      return fillArray(31, (i) =>
        stripDirectionalityCharacters(
          formatDate(dtf, new Date(2017, 0, i + 1)),
        ),
      );
    }
    return DEFAULT_DATE_NAMES;
  }

  format(date: Date, displayFormat: Object): string {
    displayFormat = { ...displayFormat, timeZone: 'utc' };
    const dtf = new Intl.DateTimeFormat('en_EN', displayFormat);
    return stripDirectionalityCharacters(formatDate(dtf, date));
  }

  isValid(date: Date): boolean {
    return !isNaN(date.getTime());
  }

  isDateInstance(obj: any): obj is Date {
    return obj instanceof Date;
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date) + months,
      this.getDate(date),
    );

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (
      this.getMonth(newDate) !=
      (((this.getMonth(date) + months) % 12) + 12) % 12
    ) {
      newDate = createDateWithOverflow(
        this.getYear(newDate),
        this.getMonth(newDate),
        0,
      );
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date),
      this.getDate(date) + days,
    );
  }
}

function fillArray<T>(length: number, fillFn: (index: number) => T): T[] {
  return new Array(length).fill(null).map((_, i) => fillFn(i));
}

/**
 * Strip out unicode LTR and RTL characters. Edge and IE insert these into formatted dates while
 * other browsers do not. We remove them to make output consistent and because they interfere with
 * date parsing.
 */
function stripDirectionalityCharacters(str: string): string {
  return str.replace(/[\u200e\u200f]/g, '');
}

/**
 * When converting Date object to string, javascript built-in functions may return wrong
 * results because it applies its internal DST rules. The DST rules around the world change
 * very frequently, and the current valid rule is not always valid in previous years though.
 * We work around this problem building a new Date object which has its internal UTC
 * representation with the local date and time.
 */
function formatDate(dtf: Intl.DateTimeFormat, date: Date): string {
  const d = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  );
  return dtf.format(d);
}

/** Creates a date but allows the month and date to overflow. */
function createDateWithOverflow(
  year: number,
  month: number,
  date: number,
): Date {
  const result = new Date(year, month, date);

  // We need to correct for the fact that JS native Date treats years in range [0, 99] as
  // abbreviations for 19xx.
  if (year >= 0 && year < 100) {
    result.setFullYear(this.getYear(result) - 1900);
  }
  return result;
}

@Injectable({
  providedIn: 'root',
  useClass: DtNativeDateAdapter,
})
export abstract class DtDateAdapter<D> {
  /** The locale to use for all dates. */
  locale: any;

  /** A stream that emits when the locale changes. */
  get localeChanges(): Observable<void> {
    return this._localeChanges.asObservable();
  }
  _localeChanges = new Subject<void>();

  /** Sets the locale used for all dates. */
  setLocale(locale: any): void {
    this.locale = locale;
    this._localeChanges.next();
  }

  /**
   * Creates a date with the given year, month, and date.
   * Does not allow over/under-flow of the month and date.
   */
  abstract createDate(year: number, month: number, date: number): D;

  /** Gets today's date. */
  abstract today(): D;

  /** Gets the year component of the given date. */
  abstract getYear(date: D): number;

  /** Gets the month component of the given date. */
  abstract getMonth(date: D): number;

  /** Gets the date of the month component of the given date. */
  abstract getDate(date: D): number;

  /** Gets the day of the week component of the given date. */
  abstract getDayOfWeek(date: D): number;

  /** Gets the first day of the week. */
  abstract getFirstDayOfWeek(): number;

  /** Gets a list of names for the days of the week. */
  abstract getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];

  /** Gets the number of days in the month of the given date. */
  abstract getNumDaysInMonth(date: D): number;

  /** Gets a list of names for the dates of the month. */
  abstract getDateNames(): string[];

  /** Checks whether the given object is considered a date instance by this DateAdapter. */
  abstract isDateInstance(obj: any): obj is D;

  /** Checks whether the given date is valid. */
  abstract isValid(date: D): boolean;

  /** Formats a date as a string according to the given format. */
  abstract format(date: D, displayFormat: Object): string;

  /**
   * Adds the given number of years to the date. Years are counted as if flipping 12 pages on the
   * calendar for each year and then finding the closest date in the new month. For example when
   * adding 1 year to Feb 29, 2016, the resulting date will be Feb 28, 2017.
   */
  abstract addCalendarYears(date: D, years: number): D;

  /**
   * Adds the given number of months to the date. Months are counted as if flipping a page on the
   * calendar for each month and then finding the closest date in the new month. For example when
   * adding 1 month to Jan 31, 2017, the resulting date will be Feb 28, 2017.
   */
  abstract addCalendarMonths(date: D, months: number): D;

  /** Adds the given number of days to the date. */
  abstract addCalendarDays(date: D, days: number): D;

  /**
   * Compares two dates.
   * Returns 0 if the dates are equal,
   * a number less than 0 if the first date is earlier,
   * a number greater than 0 if the first date is later
   */
  compareDate(first: D, second: D): number {
    return (
      this.getYear(first) - this.getYear(second) ||
      this.getMonth(first) - this.getMonth(second) ||
      this.getDate(first) - this.getDate(second)
    );
  }

  /** Clamp the given date between min and max dates. */
  clampDate(date: D, min?: D | null, max?: D | null): D {
    if (min && this.compareDate(date, min) < 0) {
      return min;
    }
    if (max && this.compareDate(date, max) > 0) {
      return max;
    }
    return date;
  }
}
