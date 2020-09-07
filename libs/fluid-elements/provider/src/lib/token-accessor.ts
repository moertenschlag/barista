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

// Don't freeze the entire object but just its values since
// that wouldn't work with the Proxy
const immutableDesignTokens = deepFreezeChildren(designTokenModule);

/** Stores CSS property names for design tokens to avoid recomputation */
const cssPropertyNameCache = new Map<string, string>();

export type FluidDesignTokens = typeof designTokenModule;

export class FluidDesignTokenAccessor {
  /** Proxy object for the design tokens */
  tokens: FluidDesignTokens; // Proxy

  /** Contains the original design token values */
  originalTokens: FluidDesignTokens = immutableDesignTokens;

  /** Stores overriden design token values by name */
  private _overrides = new Map<string, any>();

  /** Caches object keys for fast access on iteration. */
  private _allKeys = new Set([
    // All property names and symbols must be included to work
    // with the proxy even if we don't use them.
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
   * Creates or overrides a design token with the given name.
   *
   * If no design token with the given name exists, it will be created.
   * Otherwise, the value will be overwritten.
   * @param name Name of the design token
   * @param value New value of the design token
   */
  setToken(name: string, value: any): void {
    this._overrides.set(name, value);
    this._allKeys.add(name);
  }

  /**
   * Resets an overriden token to its initial value.
   *
   * If the token was created dynamically, it will be removed.
   * If an existing token was overwritten, its value will be reset.
   * @param name The name of the design token to reset
   */
  resetToken(name: string): void {
    this._overrides.delete(name);
    if (!(name in this.originalTokens)) {
      this._allKeys.delete(name);
    }
  }

  /**
   * Creates a CSS property name for the given token name
   * @param tokenName The JavaScript token name in UPPER_CASE_SNAKE_CASE
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
