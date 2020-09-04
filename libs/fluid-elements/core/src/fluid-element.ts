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

import { LitElement } from 'lit-element';
import {
  FluidDesignTokens,
  FluidProvider,
} from '@dynatrace/fluid-elements/provider';
import { getParentAcrossDomBoundaries } from '@dynatrace/fluid-elements/shared';

function findParentProvider(element: HTMLElement): FluidProvider | null {
  let parent = getParentAcrossDomBoundaries(element);
  if (parent instanceof FluidProvider || parent === null) {
    return parent;
  }

  return findParentProvider(parent);
}

export class FluidElement extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();

    this._provider =
      this instanceof FluidProvider ? this : findParentProvider(this);
    if (!this.provider) {
      throw new Error('Fluid elements must be children of a fluid-provider.');
    }
  }

  protected get provider(): FluidProvider {
    return this._provider!;
  }

  protected get designTokens(): FluidDesignTokens {
    return this._provider!.designTokens;
  }

  getDesignToken(key: string): any {
    return this.designTokens[key];
  }

  setOverride(key: string, value: any): void {
    this._provider!.setOverride(key, value);
  }

  removeOverride(key: string): void {
    this._provider!.removeOverride(key);
  }

  private _provider: FluidProvider | null = null;
}
