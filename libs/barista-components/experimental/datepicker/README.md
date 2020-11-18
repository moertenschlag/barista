# Datepicker (experimental)

The `dt-datepicker` can be used to select a date with (or without) a time.

<ba-live-example name="DtExampleDatepickerDefault" fullwidth></ba-live-example>

<ba-live-example name="DtExampleDatepickerDark" fullwidth themedark></ba-live-example>

## Initialization

To apply the Dynatrace datepicker, use the `<dt-datepicker>` element.

| Attribute       | Description             |
| --------------- | ----------------------- |
| `dt-datepicker` | The datepicker element. |

To apply the Dynatrace calendar, use the `<dt-calendar>` element.

| Attribute     | Description           |
| ------------- | --------------------- |
| `dt-calendar` | The calendar element. |

To apply the Dynatrace calendar body only, use the `<dt-calendar-body>` element.

| Attribute          | Description                |
| ------------------ | -------------------------- |
| `dt-calendar-body` | The calendar body element. |

## Imports

You have to import the `DtDatepickerModule` and `DtNativeDateModule` (in case
you would like to use the native date adapter) to use the `dt-datepicker`. The
DtNativeDateModule is based off the functionality available in JavaScript's
native Date object, which is limited when it comes to setting the parse format.
Therefore, if necessary, a custom DateAdapter can be implemented in order to
handle the formatting/parsing library of your choice.

```typescript
import { NgModule } from '@angular/core';
import { DtDatepickerModule } from '@dynatrace/barista-components/experimental/datepicker';
import { DtNativeDateModule } from '@dynatrace/barista-components/core';

@NgModule({
  imports: [DtDatepickerModule, DtNativeDateModule],
})
class MyModule {}
```

Also, in order to enable dark mode, the `DtThemingModule` has to be imported and
`DT_OVERLAY_THEMING_CONFIG` needs to be provided, such as:

```typescript
import { NgModule } from '@angular/core';
import { DtDatepickerModule } from '@dynatrace/barista-components/experimental/datepicker';
import {
  DtNativeDateModule,
  DT_DEFAULT_DARK_THEMING_CONFIG,
  DT_OVERLAY_THEMING_CONFIG,
} from '@dynatrace/barista-components/core';

@NgModule({
  imports: [DtDatepickerModule, DtNativeDateModule, DtThemingModule],
   providers: [
    {
      provide: DT_OVERLAY_THEMING_CONFIG,
      useValue: DT_DEFAULT_DARK_THEMING_CONFIG,
    },
})
class MyModule {}
```

## Inputs

Datepicker

| Name               | Type        | Default | Description                                                                                                                        |
| ------------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id                 | `string`    | `null`  | The datepicker id.                                                                                                                 |
| value              | `D \| null` | `null`  | The selected date.                                                                                                                 |
| startAt            | `D \| null` | `null`  | The date to open the calendar to initially. Is ignored if `selected` is set. Defaults to today's date internally for display only. |
| disabled           | `boolean`   | `false` | Whether the datepicker is disabled.                                                                                                |
| isTimeEnabled      | `boolean`   | `false` | Whether or not the time mode is enabled.                                                                                           |
| isTodayButtonShown | `boolean`   | `true`  | Whether or not the today button is shown.                                                                                          |
| tabIndex           | `number`    | 0       | The element's tab index.                                                                                                           |

Calendar

| Name               | Type        | Default | Description                                                                |
| ------------------ | ----------- | ------- | -------------------------------------------------------------------------- |
| selected           | `D \| null` | `null`  | The selected date.                                                         |
| startAt            | `D \| null` | `null`  | A date representing the period (month or year) to start the calendar with. |
| minDate            | `D \| null` | `null`  | The minimum valid date.                                                    |
| maxDate            | `D \| null` | `null`  | The maximum valid date.                                                    |
| isTodayButtonShown | `boolean`   | `true`  | Whether or not the today button is shown.                                  |

Calendar Body

| Name           | Type                   | Default | Description                                                                                                                                              |
| -------------- | ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| activeDate     | `D `                   | `today` | The date to display in this month view (everything other than the month and year is ignored).                                                            |
| startAt        | `D \| null`            | `null`  | A date representing the period (month or year) to start the calendar with.                                                                               |
| minDate        | `D \| null`            | `null`  | The minimum valid date.                                                                                                                                  |
| maxDate        | `D \| null`            | `null`  | The maximum valid date.                                                                                                                                  |
| dateFilter     | `(date: D) => boolean` | `null`  | Function used to filter whether a date is selectable or not.                                                                                             |
| ariaLabelledby | `string`               | `null`  | Used for the aria-labelledby and aria-describedby properties of the calendar body. If not provided, the month and year are used as label ad description. |

## Outputs

Calendar

| Name           | Type              | Description                                     |
| -------------- | ----------------- | ----------------------------------------------- |
| selectedChange | `EventEmitter<D>` | Emits when the currently selected date changes. |

Calendar Body

| Name             | Type              | Description                                     |
| ---------------- | ----------------- | ----------------------------------------------- |
| selectedChange   | `EventEmitter<D>` | Emits when the currently selected date changes. |
| activeDateChange | `EventEmitter<D>` | Emits when a date is activated.                 |

## Properties

Datepicker

| Name        | Type      | Description                             |
| ----------- | --------- | --------------------------------------- |
| `panelOpen` | `boolean` | Returns the open or closed panel state. |

Calendar

| Name         | Type      | Description              |
| ------------ | --------- | ------------------------ |
| `activeDate` | `boolean` | Returns the active date. |

#### Methods

The following methods are on the `DtDatepicker` class:

| Name     | Description            | Return value |
| -------- | ---------------------- | ------------ |
| `open`   | Opens the datepicker   | `void`       |
| `close`  | Closes the datepicker  | `void`       |
| `toggle` | Toggles the datepicker | `void`       |

## Calendar with limited date range

<ba-live-example name="DtExampleCalendarMinMax" fullwidth></ba-live-example>
