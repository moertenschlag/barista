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

// Sourced from https://github.com/microsoft/fast/blob/master/packages/web-components/fast-foundation/src/utilities/composed-parent.ts
/**
 * Returns the parent element, ignoring shadow DOM boundaries.
 *
 * If the element is a direct child of a shadow root host,
 * the shadow root's host element will be returned. Otherwise,
 * the regular element parent will be returned.
 * @param element The HTML element to retrieve the parent from
 */
export function getParentAcrossDomBoundaries<T extends HTMLElement>(
  element: T,
): HTMLElement | null {
  const parentNode = element.parentElement;

  if (parentNode) {
    return parentNode;
  } else {
    const rootNode = element.getRootNode();

    if ((rootNode as ShadowRoot).host instanceof HTMLElement) {
      return (rootNode as ShadowRoot).host as HTMLElement;
    }
  }

  return null;
}
