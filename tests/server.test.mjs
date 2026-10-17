import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fixture } from "./fixture.mjs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
const fixturePassword = "test-only-family-password";
test("private API, owner setup, validation, persistence, login and logout", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "timeline-api-"));
  await writeFile(join(dir, "timeline.json"), JSON.stringify(fixture));
  let server;
  let cookie = "";
  const base = "http://127.0.0.1:3091";
  async function start() {
    server = spawn(process.execPath, ["server.mjs"], {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        PORT: "3091",
        HOST: "127.0.0.1",
        DATA_DIR: dir,
        FAMILY_PASSWORD: "",
        TIMELINE_DATA_FILE: join(dir, "timeline.json"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    server.stderr.on("data", (d) => (output += d));
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(base + "/api/session");
        return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error("API did not start: " + output);
  }
  async function stop() {
    if (server && server.exitCode === null) {
      server.kill();
      await once(server, "exit");
    }
  }
  async function request(
    path,
    body,
    method = body === undefined ? "GET" : "POST",
    extra = {},
  ) {
    return fetch(base + "/api/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  try {
    await start();
    await t.test(
      "data and writes require authentication before setup",
      async () => {
        assert.equal((await request("timeline")).status, 401);
        assert.equal((await request("memories", {})).status, 401);
        assert.equal(
          (await (await request("session")).json()).needsSetup,
          true,
        );
      },
    );
    await t.test(
      "owner setup rejects weak passwords and foreign origins",
      async () => {
        assert.equal(
          (await request("setup", { password: "short" })).status,
          400,
        );
        assert.equal(
          (
            await request("setup", { password: fixturePassword }, "POST", {
              Origin: "https://other.example",
            })
          ).status,
          403,
        );
      },
    );
    await t.test(
      "setup creates an authenticated HttpOnly session exactly once",
      async () => {
        const r = await request("setup", { password: fixturePassword });
        assert.equal(r.status, 201);
        const c = r.headers.get("set-cookie");
        assert.match(c, /HttpOnly/);
        assert.match(c, /SameSite=Lax/);
        cookie = c.split(";")[0];
        assert.equal(
          (await request("setup", { password: fixturePassword })).status,
          409,
        );
        const data = await (await request("timeline")).json();
        assert.equal(data.events.length, fixture.events.length);
      },
    );
    await t.test("invalid dates and inverted ranges are rejected", async () => {
      for (const overrides of [
        { start: "2024-02-31" },
        { start: "2024-01-02", end: "2024-01-01" },
        { place: { city: 123, country: "Netherlands" } },
      ]) {
        const r = await request("memories", {
          title: "Test",
          start: "2024-01-01",
          person: "nadya",
          category: "Home",
          certainty: "Exact",
          notes: "",
          ...overrides,
        });
        assert.equal(r.status, 400);
      }
    });
    let added;
    await t.test("a new Nadya location is saved with coordinates", async () => {
      const r = await request("memories", {
        title: "A home in Haarlem",
        start: "2024-01-01",
        end: "",
        person: "nadya",
        category: "Home",
        certainty: "Month only",
        notes: "Test fixture",
        place: { city: "haarlem", country: "the netherlands" },
      });
      assert.equal(r.status, 201);
      added = await r.json();
      assert.equal(added.place.coordinatePrecision, "city");
      assert.equal(added.place.city, "Haarlem");
      assert.equal(added.place.country, "Netherlands");
      assert.equal(added.person, "nadya");
    });
    await stop();
    cookie = "";
    await start();
    await t.test(
      "data and password survive a process restart; sessions do not",
      async () => {
        assert.equal((await request("timeline")).status, 401);
        assert.equal(
          (await (await request("session")).json()).needsSetup,
          false,
        );
        assert.equal(
          (await request("login", { password: "incorrect" })).status,
          401,
        );
        const r = await request("login", { password: fixturePassword });
        assert.equal(r.status, 200);
        cookie = r.headers.get("set-cookie").split(";")[0];
        const data = await (await request("timeline")).json();
        assert.equal(
          data.events.find((e) => e.id === added.id).title,
          "A home in Haarlem",
        );
      },
    );
    await t.test("imported source records cannot be deleted", async () => {
      assert.equal(
        (await request("memories/home", undefined, "DELETE")).status,
        404,
      );
    });
    await t.test("added memory removal persists", async () => {
      assert.equal(
        (await request("memories/" + added.id, undefined, "DELETE")).status,
        200,
      );
      assert.equal(
        (await (await request("timeline")).json()).events.length,
        fixture.events.length,
      );
    });
    await t.test("logout invalidates the session", async () => {
      assert.equal((await request("logout", {})).status, 200);
      assert.equal((await request("timeline")).status, 401);
    });
  } finally {
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
