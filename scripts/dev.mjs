import { spawn } from "node:child_process";
const processes = [
  spawn(process.execPath, ["--watch", "server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3001" },
  }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    processes.forEach((p) => p.kill(signal));
    process.exit(0);
  });
for (const child of processes)
  child.on("exit", (code) => {
    processes.forEach((p) => p.kill());
    process.exit(code ?? 0);
  });
