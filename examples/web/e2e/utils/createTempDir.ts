import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export async function createTempDir(prefix: string) {
  const directoryPath = path.join(os.tmpdir(), prefix);
  return fs.mkdtemp(directoryPath);
}
