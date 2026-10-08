import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const installedGo = join(process.env.ProgramFiles ?? "C:/Program Files", "Go", "bin", "go.exe");
const go = process.platform === "win32" && existsSync(installedGo) ? installedGo : "go";
const child = spawn(go, ["-C", "backend", "run", process.argv[2] ?? "./cmd/api", ...process.argv.slice(3)], {
  stdio: "inherit",
  env: process.env,
});
child.on("error", (error) => {
  console.error(`Não foi possível iniciar o Go: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
