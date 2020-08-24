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

/**
 * Custom event implementation that fires when a tab is clicked providing the selected tab id
 * The reason for two events are too much recursion when calling the event in the setter of the selected attribute in the tab component.
 */
export class FluidTabSelectedEvent extends CustomEvent<any> {
  constructor(public selectedTabId: string) {
    super('select', { bubbles: true, composed: true });
  }
}

/** Custom event implementation that fires when a tab is disabled providing the disabled tab id  */
export class FluidTabDisabledEvent extends CustomEvent<any> {
  constructor(public tabId: string) {
    super('disable', { bubbles: true, composed: true });
  }
}

/** Custom event implementation that fires when a tab is blurred */
export class FluidTabBlurredEvent extends CustomEvent<any> {
  constructor(public tabId: string) {
    super('blur', { bubbles: true, composed: true });
  }
}
