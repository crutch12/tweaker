export async function isJsSyntaxValid(code: string) {
  const { parse } = await import("acorn");
  try {
    parse(code, {
      ecmaVersion: 2020,
      sourceType: "module",
    });
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err as Error,
    };
  }
}
