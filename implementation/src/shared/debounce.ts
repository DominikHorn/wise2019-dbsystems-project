const registeredLambdas: { [uid: string]: NodeJS.Timeout } = {};

/**
 * Cancels callback with given uid
 * @param uid
 */
export function cancelDebounce(uid: string): void {
  if (registeredLambdas[uid]) {
    clearTimeout(registeredLambdas[uid]);
  }
}

/**
 * This function executes a given lambda with debounce.
 * Make sure that the uid is actually unique!
 * @param uid unique identifier for this debounced expression
 * @param lambda the function to execute
 * @param timeout timout in milliseconds, by default 500
 */
export function withDebounce(
  uid: string,
  lambda: () => void,
  timeout = 500
): void {
  cancelDebounce(uid);
  registeredLambdas[uid] = setTimeout(lambda, timeout);
}
