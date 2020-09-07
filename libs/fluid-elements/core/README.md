# fluid-core

The Dynatrace design system core library contains important shared
functionality.

## FluidElement base class

This is the base class for all design system components.

### Properties

| Property       | Type            | Description                                                                                           |
| -------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`     | `FluidProvider` | The nearest ancestor `fluid-provider` of the component                                                |
| `designTokens` | `object`        | All design tokens provided by the nearest ancestor `fluid-provider` as an object with key-value pairs |

### Methods

| Method                | Type                  | Description                                                                               |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `getDesignTokenValue` | `(name: string): any` | Retrieves the value of a design token from the nearest ancestor `fluid-provider` by name. |
