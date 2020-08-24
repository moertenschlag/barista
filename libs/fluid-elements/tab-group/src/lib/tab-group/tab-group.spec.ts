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

import { FluidTabGroup } from './tab-group';
import { dispatchKeyboardEvent } from '@dynatrace/testing/browser';
import { ARROW_RIGHT, SPACE } from '@dynatrace/shared/keycodes';
import { FluidTab } from '../tab/tab';

function tick(): Promise<void> {
  return Promise.resolve();
}

describe('Fluid tab group', () => {
  let fixture: FluidTabGroup;
  let selectSpy: jest.Mock;
  let keyupSpy: jest.Mock;
  let blurSpy: jest.Mock;

  /** Get the first tab in the fluid-tab-group */
  function getFirstSpanElementFromFluidTab(): HTMLSpanElement {
    return fixture
      .querySelector('fluid-tab')
      ?.shadowRoot?.querySelector('span')!;
  }

  /** Get the last tab in the fluid-tab-group */
  function getLastSpanElementFromFluidTab(): HTMLSpanElement {
    return fixture
      .querySelector('fluid-tab:last-child')
      ?.shadowRoot?.querySelector('span')!;
  }

  beforeEach(() => {
    // Register the element, if it is not yet registed
    if (!customElements.get('fluid-tab')) {
      customElements.define('fluid-tab', FluidTab);
    }
    if (!customElements.get('fluid-tab-group')) {
      customElements.define('fluid-tab-group', FluidTabGroup);
    }
    // create the fixture
    document.body.innerHTML = `
      <fluid-tab-group>
        <fluid-tab tabid="section1">
          Section 1
        </fluid-tab>
        <fluid-tab tabid="section2">
          Section 2
        </fluid-tab>
      </fluid-tab-group>
      `;
    fixture = document.querySelector<FluidTabGroup>('fluid-tab-group')!;

    selectSpy = jest.fn();
    fixture.addEventListener('select', selectSpy);

    keyupSpy = jest.fn();
    fixture.addEventListener('keyup', keyupSpy);

    blurSpy = jest.fn();
    fixture.addEventListener('blur', blurSpy);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create the tabs', async () => {
    expect(fixture).not.toBe(null);
  });

  describe('selectedTabId attribute', () => {
    it('should not set a tab initially', async () => {
      expect(fixture.getAttribute('selectedtabid')).toBeNull(); // Passes on its own
    });

    it('should set selected tab when property is set', async () => {
      fixture.selectedTabId = 'section2';
      await tick();
      expect(fixture.getAttribute('activeTabId')).toBe('section2');
    });

    it('should set last selectedTabId attribute when a tab is clicked', async () => {
      const tab = fixture
        .querySelector('fluid-tab:last-child')
        ?.shadowRoot?.querySelector('span');
      tab?.click();
      await tick();
      expect(fixture.getAttribute('activeTabId')).toBe('section2');
    });

    // tslint:disable-next-line: dt-no-focused-tests
    it('should set last selectedTabId attribute when using key events', async () => {
      const tab = fixture.querySelector<FluidTab>('fluid-tab')!;
      dispatchKeyboardEvent(tab, 'keyup', SPACE);
      await tick();
      expect(selectSpy).toHaveBeenCalledTimes(1);
      expect(fixture.getAttribute('selectedtabid')).toBe('section1');
    });

    it('should represent the correct selectedTabId if the tab itself is set to active', async () => {
      await tick();
      const tab = fixture.querySelector<FluidTab>('fluid-tab:last-child');
      tab!.selected = true;
      await tick();
      expect(selectSpy).toBeCalledTimes(1);
      expect(tab?.selected).toBeTruthy();
      expect(fixture.getAttribute('selectedtabid')).toBe('section2');
      dispatchKeyboardEvent(tab!, 'keyup', ARROW_RIGHT);
      await tick();
      expect(keyupSpy).toBeCalledTimes(1);
      dispatchKeyboardEvent(document.activeElement!, 'keyup', SPACE);
      expect(selectSpy).toHaveBeenCalledTimes(2);
      expect(fixture.getAttribute('selectedtabid')).toBe('section2');
    });
  });

  describe('tabIndex attribute', () => {
    it('should set tabIndex to 0 when tab is clicked', async () => {
      const tab = getFirstSpanElementFromFluidTab();
      tab?.click();
      await tick();
      fixture.querySelector<FluidTab>('fluid-tab:last-child')!.click();
      getLastSpanElementFromFluidTab().click();
      await tick();
      expect(getFirstSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '-1',
      );
      expect(getLastSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '0',
      );
    });

    it('should set tabIndex to 0 when tab is selected using keys', async () => {
      const tab = fixture.querySelector<FluidTab>('fluid-tab');
      tab?.focus();
      await tick();
      dispatchKeyboardEvent(tab!, 'keyup', ARROW_RIGHT);
      await tick();
      dispatchKeyboardEvent(document.activeElement!, 'keyup', SPACE);
      await tick();
      expect(getFirstSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '-1',
      );
      expect(getLastSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '0',
      );
    });

    it('should set tabIndex to -1 when tab is disabled', async () => {
      fixture
        .querySelector<FluidTab>('fluid-tab')
        ?.setAttribute('disabled', 'true');
      await tick();
      expect(getFirstSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '-1',
      );
    });
  });

  describe('disabled attribute', () => {
    it('should set the tabIndex to 0 of the next available when the serlected tab is disabled', async () => {
      const tab1 = fixture.querySelector<FluidTab>('fluid-tab')!;
      const tab2 = fixture.querySelector<FluidTab>('fluid-tab:last-child')!;
      tab1.selected = true;
      await tick();
      expect(tab1.tabIndex).toBe(0);
      expect(tab2.tabIndex).toBe(-1);
      tab1.disabled = true;
      await tick();
      expect(tab1.tabIndex).toBe(-1);
      expect(tab2.tabIndex).toBe(0);
    });
  });

  describe('selectedTabChanged event', () => {
    it('should fire an event when a tab is clicked', async () => {
      const tab = getLastSpanElementFromFluidTab();
      tab?.click();
      await tick();
      expect(selectSpy).toBeCalledTimes(1);
    });

    it('should fire an event when using the key events', async () => {
      const tab = fixture.querySelector<FluidTab>('fluid-tab')!;
      dispatchKeyboardEvent(tab, 'keyup', SPACE);
      await tick();
      expect(selectSpy).toBeCalledTimes(1);
    });
  });

  describe('selected tab behaviour', () => {
    it('should override the tab-groups selectedTabId attribute if the tab istelf is selected', async () => {
      document.body.innerHTML = `
      <fluid-tab-group selectedTabId="section2">
        <fluid-tab tabid="section1" selected>
          Section 1
        </fluid-tab>
        <fluid-tab tabid="section2">
          Section 2
        </fluid-tab>
      </fluid-tab-group>
      `;

      fixture = document.querySelector<FluidTabGroup>('fluid-tab-group')!;
      await tick();
      expect(
        getFirstSpanElementFromFluidTab().classList.contains(
          'fluid-state--selected',
        ),
      ).toBeTruthy();
    });

    // tslint:disable-next-line: dt-no-focused-tests
    it('should set tabIndex to 0 of a available tab after removing the currently selected tab', async () => {
      document.body.innerHTML = `
      <fluid-tab-group>
        <fluid-tab tabid="section1">
          Section 1
        </fluid-tab>
        <fluid-tab tabid="section2">
          Section 2
        </fluid-tab>
        <fluid-tab tabid="section3">
          Section 3
        </fluid-tab>
      </fluid-tab-group>
      `;
      await tick();
      fixture = document.querySelector<FluidTabGroup>('fluid-tab-group')!;
      // Ticking twice otherwise the dom isn't updated since the slotchanged event isn't called yet at that point.
      await tick();
      await tick();
      expect(getFirstSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '0',
      );
      expect(getLastSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '-1',
      );

      document.body.innerHTML = `
      <fluid-tab-group>
        <fluid-tab tabid="section2">
          Section 2
        </fluid-tab>
        <fluid-tab tabid="section3">
          Section 3
        </fluid-tab>
      </fluid-tab-group>
      `;
      await tick();
      fixture = document.querySelector<FluidTabGroup>('fluid-tab-group')!;
      // Ticking twice otherwise the dom isn't updated.
      await tick();
      await tick();
      expect(getFirstSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '0',
      );
      expect(getLastSpanElementFromFluidTab().getAttribute('tabIndex')).toBe(
        '-1',
      );
    });

    it('should set the tabIndex correctly after removing all tabs', async () => {
      expect(getFirstSpanElementFromFluidTab().tabIndex).toBe(0);
      document.body.innerHTML = `
      <fluid-tab-group>
      </fluid-tab-group>
      `;
      // Ticking twice otherwise the dom isn't updated.
      await tick();
      await tick();
      fixture = document.querySelector<FluidTabGroup>('fluid-tab-group')!;
      await tick();
      expect(fixture.getAttribute('selectedtabid')).toBe(null);
    });
  });

  describe('blur Event', () => {
    it('should fire event when a tab is blurred', async () => {
      const tab = fixture.querySelector<FluidTab>('fluid-tab');
      tab?.focus();
      await tick();
      dispatchKeyboardEvent(tab!, 'keyup', ARROW_RIGHT);
      await tick();
      await tick();
      expect(blurSpy).toHaveBeenCalledTimes(1);
      expect(getFirstSpanElementFromFluidTab()?.tabIndex).toBe(-1);
      expect(getLastSpanElementFromFluidTab()?.tabIndex).toBe(0);
    });
  });

  describe('Space default scroll prevention', () => {
    it('should prevent the default scroll behaviour', () => {
      const event = dispatchKeyboardEvent(
        fixture.querySelector<FluidTab>('fluid-tab')!,
        'keydown',
        SPACE,
      );
      expect(event.defaultPrevented).toBeTruthy();
    });
  });

  describe('Multiple selected tabs', () => {
    it('Should not allow multiple tabs to be selected', async () => {
      const tab1 = fixture.querySelector<FluidTab>('fluid-tab')!;
      const tab2 = fixture.querySelector<FluidTab>('fluid-tab:last-child')!;
      tab1.selected = true;
      tab2.selected = true;
    });
  });
});
