# fluid-provider

This is an experimental component that provides design tokens to child
components. Since it sets up default styles required It registers itself as the
`fluid-provider` custom element.

## Properties

| Property       | Attribute | Type                              | Default     | Description                                     |
| -------------- | --------- | --------------------------------- | ----------- | ----------------------------------------------- |
| `theme`        | `theme`   | `'abyss' \| 'surface'`            | "'abyss'"   | Defines the theme for all child components.     |
| `layout`       | `layout`  | `'default' \| 'dense' \| 'loose'` | "'default'" | Defines the layout density inside the provider. |
| `designTokens` |           | `object`                          |             | The design tokens defined in the provider.      |

## Methods

| Method                | Type                               | Description                                              |
| --------------------- | ---------------------------------- | -------------------------------------------------------- |
| `getDesignTokenValue` | `(name: string): any`              | Retrieves the value of a design token by name.           |
| `setToken`            | `(name: string, value: any): void` | Creates or overrides a design token with the given name. |
| `resetToken`          | `(name: string): any`              | Resets an overriden token to its initial value.          |

## Events

| Event         | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `tokenchange` | Fired whenever a design token changes (e.g. due to a theme or layout density change). |

## Slots

| Name | Description                                                |
| ---- | ---------------------------------------------------------- |
|      | The default slot displays the content inside the provider. |
