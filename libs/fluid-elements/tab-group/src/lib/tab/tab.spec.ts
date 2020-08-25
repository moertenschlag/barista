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

import { FluidTab } from './tab';
import { dispatchFakeEvent } from '@dynatrace/testing/browser';

function tick(): Promise<void> {
  return Promise.resolve();
}

function getTabRootElement(
  fixture: FluidTab,
): HTMLSpanElement | null | undefined {
  return fixture.shadowRoot?.querySelector('span');
}

describe('Fluid tab', () => {
  let fixture: FluidTab;
  let selectSpy: jest.Mock;
  let blurSpy: jest.Mock;

  /** Checks if the current fixture has a selected tab */
  function isSelected(): boolean {
    return fixture.shadowRoot?.querySelector('.fluid-state--selected') !== null;
  }

  beforeEach(() => {
    // Register the element, if it is not yet registed
    if (!customElements.get('fluid-tab')) {
      customElements.define('fluid-tab', FluidTab);
    }
    // create the fixture
    document.body.innerHTML = `
      <fluid-tab>
        Section
      </fluid-tab>
      `;

    // Add spied eventListeners
    fixture = document.querySelector<FluidTab>('fluid-tab')!;

    selectSpy = jest.fn();
    fixture.addEventListener('select', selectSpy);

    blurSpy = jest.fn();
    fixture.addEventListener('blur', blurSpy);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create the tabs', async () => {
    expect(fixture).not.toBe(null);
  });

  describe('selected attribute', () => {
    it('should set the state to selected when the attribute is set to true', async () => {
      fixture.setAttribute('selected', '');
      await tick();
      expect(fixture.selected).toBeTruthy();
      expect(isSelected()).toBeTruthy();
    });

    it('should set the state to selected when the property is set to true', async () => {
      fixture.selected = true;
      await tick();
      expect(fixture.selected).toBeTruthy();
      expect(isSelected()).toBeTruthy();
    });

    it('should remove select when the attribute is removed', async () => {
      fixture.setAttribute('selected', 'true');
      await tick();
      fixture.removeAttribute('selected');
      await tick();
      expect(fixture.selected).toBeFalsy();
    });

    it('should remove select when the property is set to false', async () => {
      fixture.selected = true;
      await tick();
      expect(
        fixture.shadowRoot
          ?.querySelector('span')
          ?.classList.contains('fluid-state--selected'),
      ).toBeTruthy();
      fixture.selected = false;
      await tick();
      expect(fixture.getAttribute('selected')).toBeFalsy();
    });
  });

  describe('tabbed attribute', () => {
    it('should set the state to tabbed when the property is set to true', async () => {
      fixture.tabbed = true;
      await tick();
      expect(fixture.tabbed).toBeTruthy();
    });

    it('should have the class attached when tabbed is set', async () => {
      fixture.tabbed = true;
      await tick();
      expect(
        fixture.shadowRoot
          ?.querySelector('span')
          ?.classList.contains('fluid-state--tabbed'),
      ).toBeTruthy();
    });

    it('should not have the class attached when tabbed is set', async () => {
      fixture.tabbed = true;
      await tick();
      fixture.tabbed = false;
      await tick();
      expect(
        fixture.shadowRoot
          ?.querySelector('span')
          ?.classList.contains('fluid-state--tabbed'),
      ).toBeFalsy();
    });
  });

  describe('disabled attribute', () => {
    // Should set the disabled state when the attribute is present
    it('Should set the disabled state when the attribute is present', async () => {
      fixture.setAttribute('disabled', '');
      await tick();
      const shadowLi = getTabRootElement(fixture)!;
      expect(shadowLi.hasAttribute('disabled')).toBeTruthy();
    });

    it('Should set the disabled state when the attribute is set', async () => {
      fixture.setAttribute('disabled', 'true');
      await tick();
      const shadowLi = getTabRootElement(fixture)!;
      expect(shadowLi.hasAttribute('disabled')).toBeTruthy();
    });

    // Should set the disabled state when the property is set
    it('Should set the disabled state when the property is set', async () => {
      fixture.disabled = true;
      await tick();
      const shadowLi = getTabRootElement(fixture)!;
      expect(shadowLi.hasAttribute('disabled')).toBeTruthy();
    });

    it('Should reset the disabled state when the attribute is removed', async () => {
      fixture.removeAttribute('disabled');
      await tick();
      const shadowLi = getTabRootElement(fixture)!;
      expect(shadowLi.hasAttribute('disabled')).toBeFalsy();
    });

    // Should reflect the disabled state attribute to the host
    it('Should reflect the disabled state attribute to the host', async () => {
      fixture.disabled = true;
      await tick();
      expect(fixture.hasAttribute('disabled')).toBeTruthy();
    });

    it('should set selected to false when disabled is true', async () => {
      fixture.disabled = true;
      await tick();
      expect(fixture.selected).toBeFalsy();
    });

    it('should set tabindex to -1 when disabled is true', async () => {
      fixture.disabled = true;
      await tick();
      expect(fixture.tabIndex).toBe(-1);
    });
  });

  describe('Events', () => {
    describe('select event', () => {
      it('should fire event when tab is clicked', async () => {
        getTabRootElement(fixture)?.click();
        await tick();
        expect(selectSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('blur event', () => {
      it('should fire event when tab is clicked', async () => {
        const tab = getTabRootElement(fixture)!;
        dispatchFakeEvent(tab, 'blur', true);
        await tick();
        expect(blurSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('focus function', () => {
    it('should focus the span in the shadowdom of the tab', async () => {
      fixture.focus();
      await tick();
      expect(document.activeElement).toBe(fixture);
    });
  });
});
