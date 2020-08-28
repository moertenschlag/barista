export function deepFreeze<T>(object: T): T {
  Object.freeze(object);

  for (const property of Object.values(object)) {
    if (typeof property === 'object') {
      deepFreeze(property);
    }
  }

  return object;
}

export function deepFreezeChildren<T>(object: T): T {
  for (const property of Object.values(object)) {
    if (typeof property === 'object') {
      deepFreeze(property);
    }
  }

  return object;
}
