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
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  AfterContentInit,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { DtDateAdapter } from '@dynatrace/barista-components/core';
import { getValidDateOrNull } from './datepicker-utils/util';
import { DtCalendarBody } from './calendar-body';

let uniqueId = 0;

@Component({
  selector: 'dt-calendar',
  templateUrl: 'calendar.html',
  styleUrls: ['calendar.scss'],
  host: {
    class: 'dt-calendar',
  },
  encapsulation: ViewEncapsulation.Emulated,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtCalendar<D> implements AfterContentInit {
  /** A date representing the period (month or year) to start the calendar in. */
  @Input()
  get startAt(): D | null {
    return this._startAt
      ? this._dateAdapter.clampDate(this._startAt, this.minDate, this.maxDate)
      : null;
  }
  set startAt(value: D | null) {
    this._startAt = getValidDateOrNull(this._dateAdapter, value);
  }
  private _startAt: D | null = null;

  /** The currently selected date. */
  @Input()
  get selected(): D | null {
    return this._selected;
  }
  set selected(value: D | null) {
    this._selected = getValidDateOrNull(this._dateAdapter, value);
  }
  private _selected: D | null = null;

  /** The minimum selectable date. */
  @Input()
  get minDate(): D | null {
    return this._minDate;
  }
  set minDate(value: D | null) {
    this._minDate = getValidDateOrNull(this._dateAdapter, value);
    this._tryUpdateActiveDate();
  }
  private _minDate: D | null = null;

  /** The maximum selectable date. */
  @Input()
  get maxDate(): D | null {
    return this._maxDate;
  }
  set maxDate(value: D | null) {
    this._maxDate = getValidDateOrNull(this._dateAdapter, value);
    this._tryUpdateActiveDate();
  }
  private _maxDate: D | null = null;

  /** Property that decides whether or not the today button should be shown. */
  @Input() isTodayButtonShown = true;

  /** Emits when the currently selected date changes. */
  @Output()
  readonly selectedChange = new EventEmitter<D>();

  get activeDate(): D {
    return this._activeDate;
  }
  set activeDate(value: D) {
    this._activeDate = this._dateAdapter.clampDate(
      value,
      this.minDate,
      this.maxDate,
    );
    this._label = this._dateAdapter.format(this._activeDate, {
      year: 'numeric',
      month: 'short',
    });
    this._changeDetectorRef.markForCheck();
  }
  private _activeDate: D;

  /**
   * @internal Label for displaying the current month and year on the calendar header.
   */
  _label = '';

  /** @internal  Unique id used for the aria-label. */
  _labelid = `dt-calendar-label-${uniqueId++}`;

  @ViewChild(DtCalendarBody) _calendarBody: DtCalendarBody<D>;

  constructor(
    private _dateAdapter: DtDateAdapter<D>,
    private _changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngAfterContentInit(): void {
    this.activeDate = this.startAt || this._dateAdapter.today();
  }

  /**
   * @internal Focus on the calendar body.
   */
  focus(): void {
    if (this._calendarBody) {
      this._calendarBody.focus();
    }
  }

  /**
   * @internal Add specified number of months to the calendar.
   */
  _addMonths(months: number): void {
    this.activeDate = this._dateAdapter.addCalendarMonths(
      this.activeDate,
      months,
    );
    this._changeDetectorRef.markForCheck();
  }

  /**
   * @internal Emit change event when the selected date changes.
   */
  _selectedValueChanged(value: D): void {
    this.selectedChange.emit(
      this._dateAdapter.clampDate(value, this.minDate, this.maxDate),
    );
  }

  /**
   * @internal Set today's date when the 'Today' button is clicked
   */
  _setTodayDate(): void {
    this.selected = this._dateAdapter.today();
    this.activeDate = this.selected;
    this._selectedValueChanged(this.selected);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * @internal Try to update the active date if it's not undefined. This is necessary in case the min/max date constraints change.
   */
  _tryUpdateActiveDate(): void {
    if (this._activeDate) {
      this.activeDate = this._activeDate;
    }
  }
}
