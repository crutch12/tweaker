function debounce(fn: Function, timeout: number) {
  let executionTimeoutId: number | undefined = undefined;

  return (...args: any[]) => {
    clearTimeout(executionTimeoutId);
    executionTimeoutId = setTimeout(fn, timeout, ...args);
  };
}

export default debounce;
