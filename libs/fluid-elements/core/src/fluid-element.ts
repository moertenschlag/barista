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
import { FluidProvider } from '@dynatrace/fluid-elements/provider';
import { getParentAcrossDomBoundaries } from './util';

function findProvider(): FluidProvider | null {
  const parent = getParentAcrossDomBoundaries(this);
  while (parent !== null) {
    if (parent instanceof FluidProvider) {
      return parent;
    }
  }
  return null;
}

export class FluidElement extends LitElement {
  connectedCallback(): void {
    super.connectedCallback();

    this._provider = findProvider();
  }

  protected get provider(): FluidProvider {
    return this._provider;
  }

  private _provider: FluidProvider | null = null;
}
