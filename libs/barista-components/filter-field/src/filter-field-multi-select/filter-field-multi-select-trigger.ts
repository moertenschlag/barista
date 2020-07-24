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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  DOWN_ARROW,
  ENTER,
  ESCAPE,
  SPACE,
  TAB,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {
  Overlay,
  OverlayConfig,
  OverlayContainer,
  OverlayRef,
  PositionStrategy,
  ViewportRuler,
} from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  Host,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import {
  calculateOptionHeight,
  DtAutocompleteOrigin,
  DtOptionConfiguration,
  DT_AUTOCOMPLETE_VALUE_ACCESSOR,
  DT_OPTION_CONFIG,
} from '@dynatrace/barista-components/autocomplete';
import {
  DtFlexibleConnectedPositionStrategy,
  DtOption,
  DtOptionSelectionChange,
  dtSetUiTestAttribute,
  DtUiTestConfiguration,
  DtViewportResizer,
  DT_UI_TEST_CONFIG,
  isDefined,
  stringify,
  _countGroupLabelsBeforeOption,
  _getOptionScrollPosition,
  _readKeyCode,
} from '@dynatrace/barista-components/core';
import { DtFormField } from '@dynatrace/barista-components/form-field';
import {
  defer,
  EMPTY,
  fromEvent,
  merge,
  Observable,
  of as observableOf,
  Subject,
  Subscription,
} from 'rxjs';
import {
  delay,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { DtFilterFieldMultiSelect } from './filter-field-multi-select';

@Directive({
  selector: `input[dtFilterFieldMultiSelect]`,
  exportAs: 'dtFilterFieldMultiSelectTrigger',
  host: {
    class: 'dt-multiselect-trigger',
    '[attr.autocomplete]': 'autocompleteAttribute',
    '[attr.aria-activedescendant]': 'activeOption?.id',
    '[attr.aria-expanded]': 'multiSelectDisabled ? null : panelOpen.toString()',
    '[attr.aria-owns]':
      '(multiSelectDisabled || !panelOpen) ? null : multiSelect?.id',
    '(focusin)': '_handleFocus()',
    '(blur)': '_handleBlur()',
    '(input)': '_handleInput($event)',
    '(keydown)': '_handleKeydown($event)',
  },
  providers: [DT_AUTOCOMPLETE_VALUE_ACCESSOR],
})
export class DtFilterFieldMultiSelectTrigger<T>
  implements ControlValueAccessor, OnDestroy {
  private _optionHeight: number;
  private _maxPanelHeight: number;

  private _overlayRef: OverlayRef | null;
  private _componentDestroyed = false;
  private _overlayAttached = false;

  /** The filter-field multiSelect panel to be attached to this trigger. */
  @Input('dtFilterFieldMultiSelect')
  get multiSelect(): DtFilterFieldMultiSelect<T> {
    return this._multiSelect;
  }
  set multiSelect(value: DtFilterFieldMultiSelect<T>) {
    this._multiSelect = value;
    this._detachOverlay();
  }
  private _multiSelect: DtFilterFieldMultiSelect<T>;

  /** autocomplete` attribute to be set on the input element. */
  @Input('autocomplete') autocompleteAttribute = 'off';

  /**
   * Whether the autocomplete is disabled. When disabled, the element will
   * act as a regular input and the user won't be able to open the panel.
   */
  @Input('dtFilterFieldMultiSelectDisabled')
  get multiSelectDisabled(): boolean {
    return this._multiSelectDisabled;
  }
  set multiSelectDisabled(value: boolean) {
    this._multiSelectDisabled = coerceBooleanProperty(value);
  }
  private _multiSelectDisabled = false;

  /**
   * Reference relative to which to position the autocomplete panel.
   * Defaults to the autocomplete trigger element.
   */
  @Input('dtMultiSelectConnectedTo') connectedTo: DtAutocompleteOrigin;

  /**
   * Reference relative to which to position the autocomplete panel.
   * Defaults to the autocomplete trigger element.
   */
  // @Input('dtMultiSelectConnectedTo') connectedTo: DtAutocompleteOrigin;

  /** `View -> model callback called when value changes` */
  // tslint:disable-next-line:no-any
  private _onChange: (value: any) => void = () => {};

  /** `View -> model callback called when autocomplete has been touched` */
  private _onTouched = () => {};

  /** Whether or not the filter-field multiSelect panel is open. */
  get panelOpen(): boolean {
    return (
      !!(this._overlayRef && this._overlayRef.hasAttached()) &&
      this._multiSelect.isOpen
    );
  }

  /**
   * A stream of actions that should close the autocomplete panel, including
   * when an option is selected, on blur, and when TAB is pressed.
   */
  get panelClosingActions(): Observable<null> {
    return merge(
      this.multiSelect._keyManager.tabOut.pipe(
        filter(() => this._overlayAttached),
      ),
      this._closeKeyEventStream,
      this._getOutsideClickStream(),
      this._overlayRef
        ? this._overlayRef
            .detachments()
            .pipe(filter(() => !!this._overlayAttached))
        : observableOf(),
    ).pipe(map(() => null));
  }

  /** The currently active option, coerced to DtOption type. */
  get activeOption(): DtOption<T> | null {
    if (this.multiSelect && this.multiSelect._keyManager) {
      return this.multiSelect._keyManager.activeItem;
    }
    return null;
  }

  /** Stream of changes to the selection state of the autocomplete options. */
  readonly optionSelections: Observable<DtOptionSelectionChange<T>> = defer(
    () => {
      const optionsChanged = this.multiSelect
        ? this.multiSelect._options
        : null;

      if (optionsChanged) {
        return optionsChanged.changes.pipe(
          startWith(optionsChanged),
          switchMap(() => {
            return merge<DtOptionSelectionChange<T>>(
              ...optionsChanged.map((option) => option.selectionChange),
            );
          }),
        );
      }

      // If there are any subscribers before `ngAfterViewInit`, the `autocomplete` will be undefined.
      // Return a stream that we'll replace with the real one once everything is in place.
      return this._zone.onStable.asObservable().pipe(
        take(1),
        switchMap(() => this.optionSelections),
      );
    },
  );

  /**
   * Whether the autocomplete can open the next time it is focused. Used to prevent a focused,
   * closed autocomplete from being reopened if the user switches to another browser tab and then
   * comes back.
   */
  private _canOpenOnNextFocus = true;

  /**
   * Strategy that is used to position the panel.
   */
  private _positionStrategy: DtFlexibleConnectedPositionStrategy;

  /** Stream of keyboard events that can close the panel. */
  private readonly _closeKeyEventStream = new Subject<void>();

  /** Subscription to viewport size changes. */
  // private _viewportSubscription = EMPTY.subscribe();

  /** The subscription for closing actions (some are bound to document). */
  private _closingActionsSubscription = EMPTY.subscribe();

  /** The subscription for the window blur event */
  private _windowBlurSubscription = EMPTY.subscribe();

  /** Old value of the native input. Used to work around issues with the `input` event on IE. */
  private _previousValue: string | number | null;

  private _destroy$ = new Subject<void>();

  constructor(
    private _elementRef: ElementRef,
    private _overlay: Overlay,
    private _changeDetectorRef: ChangeDetectorRef,
    private _viewportResizer: DtViewportResizer,
    private _zone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _platform: Platform,
    private _overlayContainer: OverlayContainer,
    @Optional() @Host() private _formField?: DtFormField<string>,
    // tslint:disable-next-line:no-any
    @Optional() @Inject(DOCUMENT) private _document?: any,
    @Optional()
    @Inject(DT_UI_TEST_CONFIG)
    private _config?: DtUiTestConfiguration,
    @Optional()
    @Inject(DT_OPTION_CONFIG)
    optionConfig?: DtOptionConfiguration,
  ) {
    // tslint:disable-next-line:strict-type-predicates
    if (typeof window !== 'undefined') {
      _zone.runOutsideAngular(() => {
        this._windowBlurSubscription = fromEvent(window, 'blur')
          .pipe(takeUntil(this._destroy$))
          .subscribe(() => {
            // If the user blurred the window while the autocomplete is focused, it means that it'll be
            // refocused when they come back. In this case we want to skip the first focus event, if the
            // pane was closed, in order to avoid reopening it unintentionally.
            this._canOpenOnNextFocus =
              document.activeElement !== this._elementRef.nativeElement ||
              this.panelOpen;
          });
      });
    }

    if (this._viewportResizer) {
      this._viewportResizer
        .change()
        .pipe(takeUntil(this._destroy$))
        .subscribe(() => {
          if (this.panelOpen && this._overlayRef) {
            this._overlayRef.updateSize({ maxWidth: this._getPanelWidth() });
          }
        });
    }

    const heightConfig = calculateOptionHeight(optionConfig?.height ?? 0);

    this._optionHeight = heightConfig.height;
    this._maxPanelHeight = heightConfig.maxPanelHeight;
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._closingActionsSubscription.unsubscribe();
    this._windowBlurSubscription.unsubscribe();
    this._componentDestroyed = true;
    this._destroyPanel();
    this._closeKeyEventStream.complete();
  }

  /** Opens the filter-field multiSelect panel. */
  openPanel(): void {
    if (this._multiSelect) {
      this._attachOverlay();
    }
    this._multiSelect._initialSelection = [];
  }

  /** Closes the filter-field multiSelect panel. */
  closePanel(shouldEmit: boolean = true): void {
    if (!this._overlayAttached) {
      return;
    }

    if (this.panelOpen && shouldEmit) {
      // Only emit if the panel was visible.
      this.multiSelect.closed.emit();
    }

    this.multiSelect._isOpen = false;
    this._detachOverlay();

    // Note that in some cases this can end up being called after the component is destroyed.
    // Add a check to ensure that we don't try to run change detection on a destroyed view.
    if (!this._componentDestroyed) {
      // We need to trigger change detection manually, because
      // `fromEvent` doesn't seem to do it at the proper time.
      // This ensures that the label is reset when the
      // user clicks outside.
      this._changeDetectorRef.detectChanges();
    }
  }

  /** @internal Handles the focussing of the filter-field-multiSelect. */
  _handleFocus(): void {
    if (!this._canOpenOnNextFocus) {
      this._canOpenOnNextFocus = true;
    } else if (this._canOpen()) {
      this._previousValue = this._elementRef.nativeElement.value;
      this.openPanel();
    }
  }

  /** @internal Handler when the trigger loses focus. */
  _handleBlur(): void {
    if (this.panelOpen) {
      this.multiSelect.closed
        .pipe(take(1), takeUntil(this.multiSelect.opened.asObservable()))
        .subscribe(() => {
          this._onTouched();
        });
    } else {
      this._onTouched();
    }
  }

  /** @internal Handler when the user is typing. */
  _handleInput(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    let value: number | string | null = target.value;

    // Based on `NumberValueAccessor` from forms.
    if (target.type === 'number') {
      value = value === '' ? null : parseFloat(value);
    }

    // If the input has a placeholder, IE will fire the `input` event on page load,
    // focus and blur, in addition to when the user actually changed the value. To
    // filter out all of the extra events, we save the value on focus and between
    // `input` events, and we check whether it changed.
    // See: https://connect.microsoft.com/IE/feedback/details/885747/
    if (
      this._previousValue !== value &&
      document.activeElement === event.target
    ) {
      this._previousValue = value;
      this._onChange(value);

      if (this._canOpen()) {
        this.openPanel();
      }
    }
  }

  /** @internal Handler for the users key down events. */
  _handleKeydown(event: KeyboardEvent): void {
    const keyCode = _readKeyCode(event);

    // Prevent the default action on all escape key presses. This is here primarily to bring IE
    // in line with other browsers. By default, pressing escape on IE will cause it to revert
    // the input value to the one that it had on focus, however it won't dispatch any events
    // which means that the model value will be out of sync with the view.
    if (keyCode === ESCAPE) {
      event.preventDefault();
    }

    if (
      !this.multiSelect._applyDisabled &&
      keyCode === ENTER &&
      this.panelOpen
    ) {
      this.multiSelect.handleSubmit(event);
      this._resetActiveItem();

      event.preventDefault();
    } else if (this.multiSelect) {
      const prevActiveItem = this.multiSelect._keyManager.activeItem;
      const isArrowKey = keyCode === UP_ARROW || keyCode === DOWN_ARROW;

      if (this.panelOpen || keyCode === TAB) {
        this.multiSelect._keyManager.onKeydown(event);
      } else if (isArrowKey && this._canOpen()) {
        this.openPanel();
      }

      if (this.panelOpen && keyCode === SPACE) {
        if (this.multiSelect._keyManager.activeItem)
          this.multiSelect.toggleOption(
            this.multiSelect._keyManager.activeItem,
          );
      }

      if (
        isArrowKey ||
        this.multiSelect._keyManager.activeItem !== prevActiveItem
      ) {
        this._scrollToOption();
      }
    }
  }

  /** Determines whether the panel can be opened. */
  // private _canOpen(): boolean {
  //   const element = this._elementRef.nativeElement;
  //   return !element.readOnly && !element.disabled && !this._multiSelectDisabled;
  // }

  /** Attach the filter-field-multiSelect overlay. */
  private _attachOverlay(): void {
    if (!this._overlayRef) {
      this._overlayRef = this._overlay.create(this._getOverlayConfig());
      dtSetUiTestAttribute(
        this._overlayRef.overlayElement,
        this._overlayRef.overlayElement.id,
        this._elementRef,
        this._config,
      );
      this._overlayRef.keydownEvents().subscribe((event) => {
        const keyCode = _readKeyCode(event);
        // Close when pressing ESCAPE or ALT + UP_ARROW, based on the a11y guidelines.
        // See: https://www.w3.org/TR/wai-aria-practices-1.1/#textbox-keyboard-interaction
        if (keyCode === ESCAPE || (keyCode === UP_ARROW && event.altKey)) {
          this._resetActiveItem();
          this._closeKeyEventStream.next();
        }
      });
    } else {
      // Update the panel width and position in case anything has changed.
      this._overlayRef.updateSize({ maxWidth: this._getPanelWidth() });
      this._overlayRef.updatePosition();
    }

    if (this._overlayRef && !this._overlayRef.hasAttached()) {
      this._overlayRef.attach(this._multiSelect._portal);
      this._closingActionsSubscription = this._subscribeToClosingActions();
    }

    const wasOpen = this.panelOpen;

    this.multiSelect._isOpen = this._overlayAttached = true;

    // We need to do an extra `panelOpen` check in here, because the
    // autocomplete won't be shown if there are no options.
    if (this.panelOpen && wasOpen !== this.panelOpen) {
      this.multiSelect.opened.emit();
    }
    this.multiSelect.opened.emit();

    if (this.panelOpen) {
      this._overlayRef.updatePosition();
    }

    this.multiSelect._markForCheck();
    this._changeDetectorRef.detectChanges();
  }

  /** Detach the filter-field-multiSelect overlay */
  private _detachOverlay(): void {
    this._overlayAttached = false;
    this._closingActionsSubscription.unsubscribe();
    if (this._overlayRef) {
      this._overlayRef.detach();
    }
  }

  /** Destroys the filter-field multiSelect suggestion panel. */
  private _destroyPanel(): void {
    if (this._overlayRef) {
      this.closePanel();
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }

  private _getPanelWidth(): number | string {
    return this.multiSelect.panelWidth || this._getHostWidth();
  }

  /** Returns the width of the input element, so the panel width can match it. */
  private _getHostWidth(): number {
    return this._getConnectedElement().nativeElement.getBoundingClientRect()
      .width;
  }

  private _getConnectedElement(): ElementRef {
    if (this.connectedTo) {
      return this.connectedTo.elementRef;
    }

    return this._formField
      ? this._formField.getConnectedOverlayOrigin()
      : this._elementRef;
  }

  /** Returns the overlay configuration for the filter-field-multiSelect. */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPosition(),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      maxWidth: this._getPanelWidth(),
    });
  }

  /** Returns the overlay position. */
  private _getOverlayPosition(): PositionStrategy {
    const originalPositionStrategy = new DtFlexibleConnectedPositionStrategy(
      this._getConnectedElement(),
      this._viewportRuler,
      this._document,
      this._platform,
      this._overlayContainer,
    );

    this._positionStrategy = originalPositionStrategy
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          panelClass: 'dt-autocomplete-panel-above',
        },
        // tslint:disable-next-line:no-any
      ] as any[]);

    return this._positionStrategy;
  }

  /** Resets the active item to -1 so arrow events will activate the correct options, or to 0 if the consumer opted into it. */
  private _resetActiveItem(): void {
    this.multiSelect._keyManager.setActiveItem(
      this.multiSelect.autoActiveFirstOption ? 0 : -1,
    );
  }

  /**
   * This method listens to a stream of panel closing actions and resets the
   * stream every time the option list changes.
   */
  private _subscribeToClosingActions(): Subscription {
    const firstStable = this._zone.onStable.asObservable().pipe(take(1));
    const optionChanges = this.multiSelect._options.changes.pipe(
      tap(() => {
        this._positionStrategy.reapplyLastPosition();
      }),
      // Defer emitting to the stream until the next tick, because changing
      // bindings in here will cause "changed after checked" errors.
      delay(0),
    );
    // When the zone is stable initially, and when the option list changes...
    return (
      merge(firstStable, optionChanges)
        .pipe(
          // create a new stream of panelClosingActions, replacing any previous streams
          // that were created, and flatten it so our stream only emits closing events...
          switchMap((optionChange) => {
            this._resetActiveItem();

            if (this.panelOpen) {
              this._overlayRef!.updatePosition();
            }

            // TODO @thomas.pink: Remove/Rework once angular material issue has been resolved
            // https://github.com/angular/material2/issues/13734
            if (!optionChange) {
              this._changeDetectorRef.detectChanges();
            }
            return this.panelClosingActions;
          }),
          // when the first closing event occurs...
          take(1),
        )
        // set the value, close the panel, and complete.
        .subscribe((event) => {
          this._setValueAndClose(event);
        })
    );
  }

  /** Stream of clicks outside of the autocomplete panel. */
  private _getOutsideClickStream(): Observable<Event | null> {
    if (!this._document) {
      return observableOf(null);
    }

    return merge(
      fromEvent<MouseEvent>(this._document, 'click'),
      fromEvent<TouchEvent>(this._document, 'touchend'),
    ).pipe(
      filter((event: Event) => {
        const clickTarget = event.target as HTMLElement;
        const formField = this._formField
          ? this._formField._elementRef.nativeElement
          : null;

        return (
          this._overlayAttached &&
          clickTarget !== this._elementRef.nativeElement &&
          (!formField || !formField.contains(clickTarget)) &&
          !!this._overlayRef &&
          !this._overlayRef.overlayElement.contains(clickTarget)
        );
      }),
    );
  }

  /**
   * This method closes the panel, and if a value is specified, also sets the associated
   * control to that value. It will also mark the control as dirty if this interaction
   * stemmed from the user.
   */
  private _setValueAndClose(event: DtOptionSelectionChange<T> | null): void {
    if (event && event.source) {
      const source = event.source;
      const value = source.value;
      this._clearPreviousSelectedOption(source);
      this._setTriggerValue(value);
      this._onChange(value);
      this._elementRef.nativeElement.focus();
      this.multiSelect._emitSelectEvent(/* event.source */);
    }
    this.closePanel();
  }

  /** Clear any previous selected option and emit a selection change event for this option */
  private _clearPreviousSelectedOption(skip: DtOption<T>): void {
    this.multiSelect._options.forEach((option) => {
      if (option !== skip && option.selected) {
        option.deselect();
      }
    });
  }

  private _setTriggerValue(value: T): void {
    let stringifiedValue = '';
    if (isDefined(value)) {
      stringifiedValue = stringify(value);
    }

    const toDisplay =
      this.multiSelect && this.multiSelect.displayWith
        ? this.multiSelect.displayWith(value)
        : stringifiedValue;

    // Simply falling back to an empty string if the display value is falsy does not work properly.
    // The display value can also be the number zero and shouldn't fall back to an empty string.
    // tslint:disable-next-line:no-any
    const inputValue = isDefined(toDisplay) ? toDisplay : '';

    // If it's used within a `DtFormField`, we should set it through the property so it can go
    // through change detection.
    if (this._formField) {
      this._formField._control.value = inputValue;
    } else {
      this._elementRef.nativeElement.value = inputValue;
    }
  }

  /** Determines whether the panel can be opened. */
  private _canOpen(): boolean {
    const element = this._elementRef.nativeElement;
    return !element.readOnly && !element.disabled && !this._multiSelectDisabled;
  }

  private _scrollToOption(): void {
    const index = this.multiSelect._keyManager.activeItemIndex || 0;
    const labelCount = _countGroupLabelsBeforeOption(
      index,
      this.multiSelect._options.toArray(),
    );

    const newScrollPosition = _getOptionScrollPosition(
      index + labelCount,
      this._optionHeight,
      this.multiSelect._getScrollTop(),
      this._maxPanelHeight,
    );

    this.multiSelect._setScrollTop(newScrollPosition);
  }

  /** Implemented as part of ControlValueAccessor. */
  writeValue(value: T): void {
    Promise.resolve(null).then(() => {
      this._setTriggerValue(value);
    });
  }

  /** Implemented as part of ControlValueAccessor. */
  // tslint:disable-next-line:no-any
  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }

  /** Implemented as part of ControlValueAccessor. */
  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  /** Implemented as part of ControlValueAccessor. */
  setDisabledState(isDisabled: boolean): void {
    this._elementRef.nativeElement.disabled = isDisabled;
  }
}
