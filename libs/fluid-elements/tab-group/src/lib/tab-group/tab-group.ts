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
  LitElement,
  CSSResult,
  TemplateResult,
  html,
  property,
  css,
  unsafeCSS,
  customElement,
} from 'lit-element';

import { FluidTab } from '../tab/tab';
import {
  FluidTabSelectedEvent,
  FluidTabDisabledEvent,
  FluidTabBlurredEvent,
} from '../tab-events';
import {
  ENTER,
  SPACE,
  ARROW_RIGHT,
  ARROW_LEFT,
  TAB,
} from '@dynatrace/shared/keycodes';

import {
  FLUID_SPACING_SMALL,
  FLUID_SPACING_0,
  FLUID_SPACING_MEDIUM,
} from '@dynatrace/fluid-design-tokens';

/**
 * This is a experimental version of the tab group component
 * It registers itself as `fluid-tab-group` custom element.
 * @element fluid-tab-group
 * @slot - Default slot lets the user provide a group of fluid-tabs.
 */
@customElement('fluid-tab-group')
export class FluidTabGroup extends LitElement {
  /** Array of referrences to the fluid-tabs */
  private tabChildren: FluidTab[];

  /** Styles for the tab list component */
  static get styles(): CSSResult {
    return css`
      :host {
        /**
        * Legibility definitions should probably be
        * shipped or imported from a core
        */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      .fluid-tab-group {
        margin-block-start: ${unsafeCSS(FLUID_SPACING_SMALL)};
        margin-block-end: ${unsafeCSS(FLUID_SPACING_SMALL)};
        margin-inline-start: ${unsafeCSS(FLUID_SPACING_0)};
        margin-inline-end: ${unsafeCSS(FLUID_SPACING_0)};
        padding-inline-start: ${unsafeCSS(FLUID_SPACING_MEDIUM)};
      }
    `;
  }

  /**
   * Defines the currently selected tabid
   * @attr
   * @type string
   */
  @property({ type: String, reflect: true })
  selectedTabId: string;

  /** Sets the selected tab on click */
  private _handleSelectTab(event: FluidTabSelectedEvent): void {
    // Auto deselect tab
    const toResetTab = this.tabChildren.find(
      (tab) => tab.selected && tab.tabId !== event.selectedTabId,
    );
    if (toResetTab) {
      toResetTab.tabIndex = -1;
      toResetTab.selected = false;
      toResetTab.tabbed = false;
    }
    this.selectedTabId = event.selectedTabId;
  }

  /** Sets the selected tab on keydown (ArrowLeft and ArrowRight to select / Enter and Space to confirm) */
  private _handleKeyUp(event: KeyboardEvent): void {
    // Sets the focus outline when user tabbed into the tab group
    if (event.code === TAB) {
      const focusableTab = this.tabChildren.find((tab) => tab.tabIndex === 0);

      if (focusableTab) {
        focusableTab.tabbed = true;
      }
    }

    // Selection control. Selects the tab that was focused using tab/arrowkeys
    if (event.code === ENTER || event.code === SPACE) {
      const toBeActivatedTab = this.tabChildren.find(
        (tab) => tab.tabIndex === 0,
      );

      if (toBeActivatedTab) {
        const toDeactivateTab = this.tabChildren.find((tab) => tab.selected);
        if (toDeactivateTab) {
          toDeactivateTab.selected = false;
        }

        toBeActivatedTab.selected = true;
        this.selectedTabId = toBeActivatedTab.tabId;
      }
    }
    // Arrow control (navigate tabs)
    if (event.code === ARROW_RIGHT || event.code === ARROW_LEFT) {
      let index = this.tabChildren.findIndex(
        (tab: FluidTab) => tab.tabIndex === 0,
      );
      const oldIndex = index;
      if (event.code === ARROW_RIGHT) {
        index += 1;
      }
      if (event.code === ARROW_LEFT) {
        index -= 1;
      }
      if (index > this.tabChildren.length - 1) {
        index = 0;
      } else if (index < 0) {
        index = this.tabChildren.length - 1;
      }

      this.tabChildren[index].tabbed = true;
      this.tabChildren[oldIndex].tabbed = false;
      this.tabChildren[index].focus();
    }
  }

  /** Event handler for key down events handling 'tab' key aswell. Prevention of default scroll behavior on the SPACE key */
  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.code === SPACE) {
      event.preventDefault();
    }
  }

  /** Checks whether the next tab is also disabled or not and selects the next available tab */
  private _handleDisabled(disableTabEvent: FluidTabDisabledEvent): void {
    if (this.selectedTabId === disableTabEvent.tabId) {
      this.setFirstTabIndex();
    }
  }

  /** Resets the tabindex if the user lost focus without activating the selected tab */
  private _handleBlur(event: FluidTabBlurredEvent): void {
    // Sets the selected but not activated tabs tabindex to -1
    const toBlurTab = this.tabChildren.find((tab) => tab.tabId === event.tabId);
    const selectedTab = this.tabChildren.find((tab) => tab.selected);
    if (toBlurTab && toBlurTab.tabbed && !toBlurTab.selected) {
      toBlurTab.tabIndex = -1;
      if (selectedTab) {
        selectedTab.tabIndex = 0;
      }
    }
  }

  /** Handles changes in the slot. Initially sets the tabindex to 0 of the first available tab */
  private _slotchange(): void {
    this.tabChildren = Array.from(this.querySelectorAll('fluid-tab'));
    // Set all tabindexes to -1 because the default is 0
    for (const tab of this.tabChildren) {
      tab.tabIndex = -1;
    }
    this.checkForMutipleSelectedTabs();
    // Selectes a tab
    const selectedTab = this.tabChildren.find((tab) => tab.selected);
    if (selectedTab) {
      selectedTab.tabIndex = 0;
      this.selectedTabId = selectedTab.tabId;
    } else {
      this.setFirstTabIndex();
    }
  }

  /**
   * Render function of the custom element. It is called when one of the
   * observedProperties (annotated with @property) changes.
   */
  render(): TemplateResult {
    return html`
      <div
        class="fluid-tab-group"
        @select="${this._handleSelectTab}"
        @blur="${this._handleBlur}"
        @keyup="${this._handleKeyUp}"
        @keydown="${this._handleKeyDown}"
        @disable="${this._handleDisabled}"
      >
        <slot @slotchange="${this._slotchange}"></slot>
      </div>
    `;
  }

  /** Sets the tabindex to 0 of the first available tab. (Not disabled) */
  setFirstTabIndex(): void {
    let tabToEnable: FluidTab | undefined;
    if (
      this.selectedTabId &&
      this.tabChildren.find(
        (tab) => tab.tabId === this.selectedTabId && !tab.disabled,
      )
    ) {
      tabToEnable = this.tabChildren.find(
        (tab) => tab.tabId === this.selectedTabId,
      );
    } else {
      tabToEnable = this.tabChildren.find((tab) => !tab.disabled);
    }
    if (tabToEnable) {
      tabToEnable.tabIndex = 0;
    }
  }

  /** Checks whether multiple tabs are selected. If so deselect every tab but the first. */
  checkForMutipleSelectedTabs(): void {
    if (this.tabChildren.length > 0) {
      const tabs = this.tabChildren.filter((tab) => {
        if (tab.selected) {
          return tab;
        }
      });

      if (tabs.length > 1) {
        const selectedTab = tabs[0];
        for (const tab of this.tabChildren) {
          tab.selected = false;
        }
        const tabToBeSelected = this.tabChildren.find(
          (tab) => tab.tabId === selectedTab?.tabId,
        );
        if (tabToBeSelected) {
          tabToBeSelected.selected = true;
        }
      }
    }
  }
}
