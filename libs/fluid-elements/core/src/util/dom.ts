// Sourced from https://github.com/microsoft/fast/blob/master/packages/web-components/fast-foundation/src/utilities/composed-parent.ts
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
