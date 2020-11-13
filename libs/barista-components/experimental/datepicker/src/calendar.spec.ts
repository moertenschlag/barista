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
import { DtCalendar, DtDatepickerModule } from '..';

describe('DtCalendar', () => {
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
          SimpleCalendarTestApp,
          SimpleCalendarWithoutStartDateTestApp,
        ],
      });

      TestBed.compileComponents();
    }),
  );

  describe('basic behavior', () => {
    let fixture: ComponentFixture<SimpleCalendarTestApp>;
    let component: SimpleCalendarTestApp;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleCalendarTestApp);
      component = fixture.componentInstance;

      fixture.detectChanges();
    }));

    describe('calendar date selection', () => {
      it('should correctly set the start date and active date if startAt is set', () => {
        expect(component.calendar.activeDate).toEqual(component.startAt);
      });
    });
  });

  describe('basic behavior when no start date is defined', () => {
    let fixture: ComponentFixture<SimpleCalendarWithoutStartDateTestApp>;
    let component: SimpleCalendarWithoutStartDateTestApp;

    beforeEach(fakeAsync(() => {
      fixture = createComponent(SimpleCalendarWithoutStartDateTestApp);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }));

    describe('calendar date selection', () => {
      it("should set today's date if startAt is not set", () => {
        expect(component.calendar.activeDate).not.toEqual(
          component.calendar.startAt,
        );
        expect(component.calendar.activeDate.getDate()).toEqual(
          component._dateAdapter.today().getDate(),
        );
        expect(component.calendar.activeDate.getMonth()).toEqual(
          component._dateAdapter.today().getMonth(),
        );
        expect(component.calendar.activeDate.getFullYear()).toEqual(
          component._dateAdapter.today().getFullYear(),
        );
      });
    });
  });
});

@Component({
  selector: 'dt-test-app',
  template: ` <dt-calendar [startAt]="startAt"></dt-calendar> `,
})
class SimpleCalendarTestApp {
  startAt = new Date(2020, 7, 31);

  @ViewChild(DtCalendar) calendar: DtCalendar<any>;

  constructor(public _dateAdapter: DtDateAdapter<any>) {}
}

@Component({
  selector: 'dt-test-app',
  template: ` <dt-calendar [startAt]="startAt"></dt-calendar> `,
})
class SimpleCalendarWithoutStartDateTestApp {
  @ViewChild(DtCalendar) calendar: DtCalendar<Date>;

  constructor(public _dateAdapter: DtDateAdapter<Date>) {}
}
