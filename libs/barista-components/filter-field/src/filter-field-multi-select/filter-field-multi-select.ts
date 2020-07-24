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

import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { TemplatePortal } from '@angular/cdk/portal';
// tslint:disable: template-cyclomatic-complexity
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { DtCheckboxChange } from '@dynatrace/barista-components/checkbox';
import { DtOption } from '@dynatrace/barista-components/core';
import { xor } from 'lodash-es';
import { merge, Subject } from 'rxjs';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { DtNodeDef, isDtGroupDef } from '../types';

let _uniqueIdCounter = 0;

export class DtFilterFieldMultiSelectSubmittedEvent<T> {
  constructor(
    /** Reference to the filter field multiSelect panel that emitted the event. */
    public source: DtFilterFieldMultiSelect<any>,
    /** Selected option(s) */
    public multiSelect: T[],
  ) {}
}

/** Default `dt-multi-select` options that can be overridden. */
export interface DtMultiSelectDefaultOptions {
  /** Whether the first option should be highlighted when an multi-select panel is opened. */
  autoActiveFirstOption?: boolean;
}

/** Injection token to be used to override the default options for `dt-multi-select`. */
export const DT_MULTI_SELECT_DEFAULT_OPTIONS = new InjectionToken<
  DtMultiSelectDefaultOptions
>('dt-multi-select-default-options', {
  providedIn: 'root',
  factory: DT_MULTI_SELECT_DEFAULT_OPTIONS_FACTORY,
});

/** @docs-private */
export function DT_MULTI_SELECT_DEFAULT_OPTIONS_FACTORY(): DtMultiSelectDefaultOptions {
  return { autoActiveFirstOption: true };
}

@Component({
  selector: 'dt-filter-field-multi-select',
  templateUrl: 'filter-field-multi-select.html',
  styleUrls: ['filter-field-multi-select.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  exportAs: 'dtFilterFieldMultiSelect',
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DtFilterFieldMultiSelect<T> implements AfterViewInit {
  /**
   * Whether the first option should be highlighted when the multi-select panel is opened.
   * Can be configured globally through the `DT_MULTI_SELECT_DEFAULT_OPTIONS` token.
   */
  @Input()
  get autoActiveFirstOption(): boolean {
    return this._autoActiveFirstOption;
  }
  set autoActiveFirstOption(value: boolean) {
    this._autoActiveFirstOption = coerceBooleanProperty(value);
  }
  private _autoActiveFirstOption: boolean;

  /**
   * Specify the width of the multi-select panel.  Can be any CSS sizing value, otherwise it will
   * match the width of its host.
   */
  @Input() panelWidth: string | number;

  /** Function that maps an option's control value to its display value in the trigger. */
  @Input() displayWith: ((value: T) => string) | null = null;

  /** Options or groups to be displayed */
  @Input()
  get optionsOrGroups(): Array<T & DtNodeDef> {
    return this._optionsOrGroups ?? [];
  }
  set optionsOrGroups(opts: Array<T & DtNodeDef>) {
    this._optionsOrGroups = !!opts ? opts : [];
    this._filterOptions();
  }
  _optionsOrGroups: Array<T & DtNodeDef> = [];
  _filteredOptionsOrGroups: Array<T & DtNodeDef> = [];

  /** Value input by the user used to highlight and filter */
  @Input()
  get inputValue(): string {
    return this._inputValue || '';
  }
  set inputValue(value: string) {
    this._inputValue = value.toLowerCase();
    this._checkApplyDisable();
    this._filterOptions();
  }
  _inputValue: string;

  /** Event that is emitted when the filter-field multiSelect panel is opened. */
  @Output() readonly opened = new EventEmitter<void>();

  /** Event that is emitted when the filter-field multiSelect panel is closed. */
  @Output() readonly closed = new EventEmitter<void>();

  /** Event that is emitted whenever an option from the list is selected. */
  @Output() readonly multiSelectSubmitted = new EventEmitter<
    DtFilterFieldMultiSelectSubmittedEvent<T>
  >();

  /** Unique ID to be used by filter-field multiSelect trigger's "aria-owns" property. */
  id = `dt-filter-field-multiSelect-${_uniqueIdCounter++}`;

  /** Whether the filter-field multiSelect panel is open. */
  get isOpen(): boolean {
    return this._isOpen;
  }
  /** @internal Whether the filter-field multiSelect panel is open. */
  _isOpen = false;

  /** @internal */
  @ViewChild(TemplateRef, { static: true }) _template: TemplateRef<{}>;

  /**
   * @internal Reference to the panel which will be created in the overlay.
   */
  @ViewChild('panel') _panel: ElementRef;

  /** @internal Querylist of options to be used in keymanager */
  @ViewChildren(DtOption)
  _options = new QueryList<DtOption<T>>();

  /**
   * @internal
   * Manages active item in option list based on key events.
   */
  _keyManager: ActiveDescendantKeyManager<DtOption<T>>;

  /** @internal */
  _portal: TemplatePortal;

  /** @internal Holds the current values of the input field for the from value */
  _currentSelection: T[] = [];

  /** @internal Holds the current values of the input field for the from value */
  _initialSelection: T[] = [];

  /** @internal Holds the current values of the input field for the from value */
  _applyDisabled: boolean;

  /** Subject used for unsubscribing */
  private _destroy$ = new Subject<void>();

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(DT_MULTI_SELECT_DEFAULT_OPTIONS)
    defaults: DtMultiSelectDefaultOptions,
    private _ngZone?: NgZone,
  ) {
    this._autoActiveFirstOption = !!defaults.autoActiveFirstOption;
  }

  ngAfterViewInit(): void {
    this._portal = new TemplatePortal<{}>(
      this._template,
      this._viewContainerRef,
    );

    // init keymanager with options
    this._keyManager = new ActiveDescendantKeyManager<DtOption<T>>(
      this._options,
    ).withWrap();

    this._options.changes
      .pipe(
        startWith(null),
        switchMap(() =>
          merge(...this._options.map((option) => option._optionHovered)),
        ),
        takeUntil(this._destroy$),
      )
      .subscribe((option) => {
        this._ngZone?.run(() => {
          this._keyManager.setActiveItem(option);
        });
      });
  }

  /**
   * @internal
   * Sets the panel scrollTop. This allows us to manually scroll to display options
   * above or below the fold, as they are not actually being focused when active.
   */
  _setScrollTop(scrollTop: number): void {
    if (this._panel) {
      this._panel.nativeElement.scrollTop = scrollTop;
    }
  }

  /**
   * @internal
   * Returns the panel's scrollTop.
   */
  _getScrollTop(): number {
    return this._panel ? this._panel.nativeElement.scrollTop : 0;
  }

  /** @internal Marks the filter-field multiSelect for change detection. */
  _markForCheck(): void {
    this._changeDetectorRef.markForCheck();
  }

  /** @internal Unique ID to be used on a local element */
  _getLocalId(suffix: string): string {
    return `${this.id}-${suffix}`;
  }

  /**  Handles the submit of multiSelect values. */
  handleSubmit(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();

    this._emitSelectEvent();
  }

  /**
   * @internal
   * Emits the `select` event.
   */
  _emitSelectEvent(): void {
    this.multiSelectSubmitted.emit(
      new DtFilterFieldMultiSelectSubmittedEvent(this, this._currentSelection),
    );
    // After emission we need to reset the multiSelect state, to have a fresh one
    // if another multiSelect opens.
    this._currentSelection = [];
  }

  /** @internal Set pre selected options for the multiSelect input fields. */
  _setInitialSelection(values: T[]): void {
    if (Array.isArray(values)) {
      this._initialSelection = values;
      this._currentSelection = values.slice();
    } else {
      this._initialSelection = [];
    }
    this._checkApplyDisable();
  }

  /** Toggle option */
  toggleOption(option: Highlightable & DtOption<T>): void {
    this._currentSelection.includes(option.value)
      ? (this._currentSelection = this._currentSelection.filter(
          (opt) => opt != option.value,
        ))
      : this._currentSelection.push(option.value);
    this._checkApplyDisable();
  }

  /** @internal Toggle option from template */
  _toggleOptionFromTemplate(event: DtCheckboxChange<T>): void {
    if (event.checked) this._currentSelection.push(event.source.value);
    else
      this._currentSelection = this._currentSelection.filter(
        (opt) => opt !== event.source.value,
      );
    this._checkApplyDisable();
  }

  /** Check if option is selected */
  _isOptionSelected(option: T): boolean {
    return !!this._currentSelection.find((opt) => opt === option);
  }

  private _checkApplyDisable(): void {
    this._applyDisabled =
      this._currentSelection.length === 0 ||
      xor(this._currentSelection, this._initialSelection).length === 0;
  }

  private _filterOptions(): void {
    if (this.inputValue.trim().length > 0) {
      this._filteredOptionsOrGroups = this.optionsOrGroups
        .map((optOrGroup) =>
          isDtGroupDef(optOrGroup)
            ? {
                ...optOrGroup,
                group: {
                  ...optOrGroup.group,
                  options: optOrGroup.group?.options.filter((option) =>
                    option.option?.viewValue
                      .toLowerCase()
                      .includes(this._inputValue),
                  ),
                },
              }
            : optOrGroup,
        )
        .filter((optOrGroup) =>
          isDtGroupDef(optOrGroup)
            ? optOrGroup.group?.options?.length
            : optOrGroup.option?.viewValue
                .toLowerCase()
                .includes(this._inputValue),
        );
    } else {
      this._filteredOptionsOrGroups = this.optionsOrGroups;
    }
  }
}
