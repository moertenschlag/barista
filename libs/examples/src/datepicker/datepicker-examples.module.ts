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
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DtCheckboxModule } from '@dynatrace/barista-components/checkbox';
import {
  DtNativeDateModule,
  DT_DEFAULT_DARK_THEMING_CONFIG,
  DT_OVERLAY_THEMING_CONFIG,
} from '@dynatrace/barista-components/core';
import { DtDatepickerModule } from '@dynatrace/barista-components/experimental/datepicker';
import { DtThemingModule } from '@dynatrace/barista-components/theming';
import { DtExampleDatepickerDark } from './datepicker-dark-example/datepicker-dark-example';
import { DtExampleDatepickerDefault } from './datepicker-default-example/datepicker-default-example';

@NgModule({
  imports: [
    FormsModule,
    DtDatepickerModule,
    DtThemingModule,
    DtCheckboxModule,
    DtNativeDateModule,
  ],
  declarations: [DtExampleDatepickerDark, DtExampleDatepickerDefault],
  providers: [
    {
      provide: DT_OVERLAY_THEMING_CONFIG,
      useValue: DT_DEFAULT_DARK_THEMING_CONFIG,
    },
  ],
})
export class DtExamplesDatepickerModule {}
