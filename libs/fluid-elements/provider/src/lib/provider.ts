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
  html,
  LitElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  // unsafeCSS,
  customElement,
} from 'lit-element';
// import { classMap } from 'lit-html/directives/class-map';
import { FluidDesignTokenAccessor, FluidDesignTokens } from './token-accessor';

/** Defines the possible layout density options. */
export type FluidLayoutDensity = 'default' | 'dense' | 'loose';

/** Defines the available themes. */
export type FluidTheme = 'abyss' | 'surface';

const supportsAdoptedStylesheets =
  'adoptedStyleSheets' in window.ShadowRoot.prototype;

@customElement('fluid-provider')
export class FluidProvider extends LitElement {
  /** Styles for the provider component */
  static get styles(): CSSResult {
    return css`
      :host {
        /**
        * Legibility definitions
        */
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
    `;
  }

  /**
   * Defines the theme that should be used for child components.
   * @attr
   * @type {'abyss' | 'surface'}
   * @default 'abyss'
   */
  @property({ type: String, reflect: true })
  get theme(): FluidTheme {
    return this._theme;
  }
  set theme(value: FluidTheme) {
    if (value !== this._theme) {
      const oldValue = this._theme;
      this._theme = value;
      this.requestUpdate('theme', oldValue);

      this._updateThemeOverrides();
      this._updateCustomProperties();
    }
  }
  private _theme: FluidTheme = 'abyss';

  /**
   * Defines the layout density inside the container.
   * @attr
   * @type {'default' | 'dense' | 'loose'}
   * @default 'default'
   */
  @property({ type: String, reflect: true })
  get layout(): FluidLayoutDensity {
    return this._layout;
  }
  set layout(value: FluidLayoutDensity) {
    if (value !== this._layout) {
      const oldValue = this._layout;
      this._layout = value;
      this.requestUpdate('layout', oldValue);

      this._updateSpacingOverrides();
      this._updateCustomProperties();
    }
  }

  /**
   *
   */
  get designTokens(): FluidDesignTokens {
    return this._tokenAccessor.tokens;
  }

  private _layout: FluidLayoutDensity = 'default';

  private _style: CSSStyleDeclaration;

  private _tokenAccessor: FluidDesignTokenAccessor = new FluidDesignTokenAccessor();

  /**
   *
   */
  private readonly _layoutDensityMultiplicators: {
    [key in FluidLayoutDensity]: number;
  } = {
    dense: parseFloat(this.designTokens.FLUID_LAYOUT_DENSE),
    default: parseFloat(this.designTokens.FLUID_LAYOUT_DEFAULT),
    loose: parseFloat(this.designTokens.FLUID_LAYOUT_LOOSE),
  };

  constructor() {
    super();

    if (supportsAdoptedStylesheets && this.shadowRoot !== null) {
      const sheet = new CSSStyleSheet();
      sheet.insertRule(':host{}');
      (this.shadowRoot as any).adoptedStyleSheets = [
        ...(this.shadowRoot as any).adoptedStyleSheets,
        sheet,
      ];

      this._style = (sheet.rules[0] as CSSStyleRule).style;
    } else {
      this._style = this.style;
    }
  }

  /**
   *
   */
  connectedCallback(): void {
    super.connectedCallback();

    this._updateThemeOverrides();
    this._updateCustomProperties();

    console.log(Object.keys(this.designTokens).length);
  }

  /**
   *
   * @param key
   */
  getDesignToken(key: string): any {
    return this.designTokens[key];
  }

  /**
   *
   * @param key
   * @param value
   */
  setOverride(key: string, value: any): void {
    this._tokenAccessor.setOverride(key, value);
  }

  /**
   *
   * @param key
   */
  removeOverride(key: string): void {
    this._tokenAccessor.removeOverride(key);
  }

  /**
   * Render function of the custom element. It is called when one of the
   * observedProperties (annotated with @property) changes.
   */
  render(): TemplateResult {
    return html`<slot></slot>`;
  }

  private _setCustomPropertyFromToken(name: string, value: string): void {
    const propertyName = `--${name.toLowerCase().replace(/\_/g, '-')}`;
    const propertyValue = (value as string | number).toString();
    this._style.setProperty(propertyName, propertyValue);
  }

  private _updateCustomProperties(): void {
    for (const [name, value] of Object.entries(this.designTokens)) {
      if (typeof value !== 'string' && typeof value !== 'number') {
        continue;
      }

      this._setCustomPropertyFromToken(name, value);
    }
  }

  private _updateThemeOverrides(): void {
    const themeTokens = this.designTokens.THEMES[this.theme.toUpperCase()];
    for (const [name, value] of Object.entries(themeTokens)) {
      this.setOverride(name, value);
    }
  }

  private _updateSpacingOverrides(): void {
    const spacingTokens = Object.entries(
      this._tokenAccessor.originalTokens,
    ).filter(
      ([name, value]) =>
        name.startsWith('FLUID_SPACING') && typeof value === 'string',
    );
    const densityMultiplicator = this._layoutDensityMultiplicators[
      this._layout
    ];

    for (const [name, value] of spacingTokens) {
      // HACK: gets rid of the unit and assumes that all spacings are in pixels.
      // The design tokens should be changed to numeric values instead in the future.
      const valueWithoutUnit = parseInt((value as unknown) as string, 10);
      const densityAdjustedValue = Math.round(
        valueWithoutUnit * densityMultiplicator,
      );
      this.setOverride(name, `${densityAdjustedValue}px`);
    }
  }
}
