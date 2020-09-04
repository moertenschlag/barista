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
import * as designTokenModule from '@dynatrace/fluid-design-tokens';
import { deepFreezeChildren } from '@dynatrace/fluid-elements/shared';

const immutableDesignTokens = deepFreezeChildren(designTokenModule);

/**
 *
 */
const cssPropertyNameCache = new Map<string, string>();

export type FluidDesignTokens = typeof designTokenModule;

export class FluidDesignTokenAccessor {
  /**
   *
   */
  tokens: FluidDesignTokens; // Proxy

  /**
   *
   */
  originalTokens: FluidDesignTokens = immutableDesignTokens;

  /**
   *
   */
  private _overrides = new Map<string, any>();

  /**
   * Object keys are cached for fast access on iteration.
   */
  private _allKeys = new Set([
    ...Object.getOwnPropertyNames(this.originalTokens),
    ...Object.getOwnPropertySymbols(this.originalTokens),
  ]);

  constructor() {
    const overrides = this._overrides;
    const allKeys = this._allKeys;

    this.tokens = new Proxy(this.originalTokens, {
      get(
        target: FluidDesignTokens,
        property: PropertyKey,
        receiver: any,
      ): any {
        if (typeof property !== 'string') {
          return undefined;
        }

        return (
          overrides.get(property) ?? Reflect.get(target, property, receiver)
        );
      },

      set(): boolean {
        throw new Error(
          'Setting design tokens directly is not allowed, use setOverride() instead.',
        );
      },

      has(_: FluidDesignTokens, property: PropertyKey): boolean {
        return typeof property === 'string' && allKeys.has(property);
      },

      enumerate(): PropertyKey[] {
        return [...allKeys];
      },

      ownKeys(): PropertyKey[] {
        return [...allKeys];
      },

      getOwnPropertyDescriptor(
        target: FluidDesignTokens,
        property: PropertyKey,
      ): PropertyDescriptor | undefined {
        // Required for Object.keys(), Object.entries() etc.
        const defaultPropertyDescriptor = Reflect.getOwnPropertyDescriptor(
          target,
          property,
        );
        if (defaultPropertyDescriptor) {
          return defaultPropertyDescriptor;
        }

        if (typeof property === 'string' && overrides.has(property)) {
          return {
            enumerable: true,
            configurable: true,
          };
        }

        return undefined;
      },
    });
  }

  /**
   *
   * @param name
   * @param value
   */
  setOverride(name: string, value: any): void {
    this._overrides.set(name, value);
    this._allKeys.add(name);
  }

  /**
   *
   * @param name
   */
  removeOverride(name: string): void {
    this._overrides.delete(name);
    if (!(name in this.originalTokens)) {
      this._allKeys.delete(name);
    }
  }

  /**
   *
   * @param tokenName
   */
  getCssPropertyName(tokenName: string): string {
    let cachedName = cssPropertyNameCache[tokenName];
    if (!cachedName) {
      cachedName = cssPropertyNameCache[
        tokenName
      ] = `--${tokenName.toLowerCase().replace(/\_/g, '-')}`;
    }
    return cachedName;
  }
}
