import { spawn } from "node:child_process";

export async function runShellCommand(command) {
  return new Promise((resolve, reject) => {
    spawn(command, [], { shell: true, stdio: "inherit" })
      .addListener("error", reject)
      .addListener("close", resolve);
  });
}
