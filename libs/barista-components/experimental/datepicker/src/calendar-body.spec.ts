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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  DtDateAdapter,
  DtNativeDateModule,
} from '@dynatrace/barista-components/core';
import { DtIconModule } from '@dynatrace/barista-components/icon';
import { DtThemingModule } from '@dynatrace/barista-components/theming';
import { createComponent } from '@dynatrace/testing/browser';
import { DtCalendarBody, DtDatepickerModule } from '..';

describe('DtCalendarBody', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          DtDatepickerModule,
          DtThemingModule,
          HttpClientTestingModule,
          DtNativeDateModule,
          DtIconModule.forRoot({
            svgIconLocation: `{{name}}.svg`,
          }),
        ],
        declarations: [
          SimpleCalendarBodyTestApp,
          SimpleCalendarBodyLimitedDateTestApp,
        ],
      });

      TestBed.compileComponents();
    }),
  );

  describe('calendar body with min and max dates', () => {
    let fixture: ComponentFixture<SimpleCalendarBodyLimitedDateTestApp>;
    let component: SimpleCalendarBodyLimitedDateTestApp;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleCalendarBodyLimitedDateTestApp);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    it('should set the min date as active if a date earlier than the min date is selected', () => {
      component.calendarBody.activeDate = new Date(2000, 1, 1);
      fixture.detectChanges();
      expect(component.calendarBody.activeDate).toEqual(
        component.calendarBody.minDate,
      );
    });

    it('should set the max date as active if a date later than the max date is selected', () => {
      component.calendarBody.activeDate = new Date(2030, 1, 1);
      fixture.detectChanges();
      expect(component.calendarBody.activeDate).toEqual(
        component.calendarBody.maxDate,
      );
    });
  });

  describe('basic behavior', () => {
    let fixture: ComponentFixture<SimpleCalendarBodyTestApp>;
    let component: SimpleCalendarBodyTestApp;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleCalendarBodyTestApp);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    describe('calendar body date selection', () => {
      it('should set the active date to today by default', () => {
        expect(component.calendarBody.activeDate.getDate()).toEqual(
          component._dateAdapter.today().getDate(),
        );
        expect(component.calendarBody.activeDate.getMonth()).toEqual(
          component._dateAdapter.today().getMonth(),
        );
        expect(component.calendarBody.activeDate.getFullYear()).toEqual(
          component._dateAdapter.today().getFullYear(),
        );
      });

      it('should emit a selectedChange event a date is selected date', () => {
        const changeSpy = jest.fn();
        component.calendarBody.selectedChange.subscribe(changeSpy);
        let selectedCell = {
          displayValue: '1',
          value: 1,
          rawValue: new Date(2020, 7, 1),
          ariaLabel: 'Aug 1, 2020',
        };
        component.calendarBody._cellClicked(selectedCell);
        fixture.detectChanges();
        expect(changeSpy).toHaveBeenCalledTimes(1);
      });

      it('should emit an activeDateChange event if the active date is changed', () => {
        const changeSpy = jest.fn();
        component.calendarBody.activeDateChange.subscribe(changeSpy);
        let selectedCell = {
          displayValue: '5',
          value: 5,
          rawValue: new Date(2020, 7, 5),
          ariaLabel: 'Aug 5, 2020',
        };
        component.calendarBody._cellClicked(selectedCell);
        fixture.detectChanges();
        expect(changeSpy).toHaveBeenCalledTimes(1);
      });

      it('should not emit an activeDateChange event if the same active date is selected', () => {
        component.calendarBody.activeDate = new Date(2020, 7, 5);
        fixture.detectChanges();

        const changeSpy = jest.fn();
        component.calendarBody.activeDateChange.subscribe(changeSpy);
        let selectedCell = {
          displayValue: '5',
          value: 5,
          rawValue: new Date(2020, 7, 5),
          ariaLabel: 'Aug 5, 2020',
        };
        component.calendarBody._cellClicked(selectedCell);
        fixture.detectChanges();
        expect(changeSpy).not.toHaveBeenCalled();
      });
    });
  });
});

// ###################################
// Testing components
// ###################################

@Component({
  selector: 'dt-test-app',
  template: ` <dt-calendar-body [selected]="selected"></dt-calendar-body> `,
})
class SimpleCalendarBodyTestApp {
  selected = new Date(2020, 10, 15);
  @ViewChild(DtCalendarBody) calendarBody: DtCalendarBody<any>;

  constructor(public _dateAdapter: DtDateAdapter<any>) {}
}

@Component({
  selector: 'dt-test-min-max-app',
  template: `
    <dt-calendar-body
      [minDate]="minDate"
      [maxDate]="maxDate"
    ></dt-calendar-body>
  `,
})
class SimpleCalendarBodyLimitedDateTestApp {
  @ViewChild(DtCalendarBody) calendarBody: DtCalendarBody<Date>;
  minDate = new Date(2020, 11, 13);
  maxDate = new Date(2021, 1, 1);

  constructor(public _dateAdapter: DtDateAdapter<Date>) {}
}
