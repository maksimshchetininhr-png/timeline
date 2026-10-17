import { fixture } from "../tests/fixture.mjs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const dir = await mkdtemp(join(tmpdir(), "family-timeline-e2e-"));
await writeFile(join(dir, "timeline.json"), JSON.stringify(fixture));
const child = spawn(process.execPath, ["server.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: "3092",
    HOST: "127.0.0.1",
    DATA_DIR: dir,
    FAMILY_PASSWORD: "",
    TIMELINE_DATA_FILE: join(dir, "timeline.json"),
  },
});
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  child.kill();
  await rm(dir, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", async (code) => {
  await rm(dir, { recursive: true, force: true });
  process.exit(code || 0);
});
