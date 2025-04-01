interface Params {
  [key: string]: any;
}

export function merge(defaultParams: Params, mergeParams: Params): Params {
  const mergedOptions: Params = {};
  for (const option in defaultParams) {
    mergedOptions[option] = defaultParams[option];
    if (typeof mergeParams[option] !== 'undefined') {
      mergedOptions[option] = mergeParams[option];
    }
  }
  return mergedOptions;
}

export function isJSON(json: any): boolean {
  try {
    if (json instanceof Object && JSON.parse(JSON.stringify(json))) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
} 