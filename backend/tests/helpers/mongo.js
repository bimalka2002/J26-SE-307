import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";

// An isolated disposable database; never reads the development .env or database.
export async function startMongo(port) {
  const directory = await mkdtemp(join(tmpdir(), "oralscan-auth-"));
  const child = spawn(process.env.MONGOD_BINARY || "mongod", ["--dbpath", directory, "--port", String(port), "--bind_ip", "127.0.0.1", "--quiet"], { stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`MongoDB test startup timed out: ${log}`)), 20000);
    child.on("error", (error) => { clearTimeout(timeout); reject(error); });
    child.on("exit", (code) => { clearTimeout(timeout); reject(new Error(`MongoDB exited (${code}): ${log}`)); });
    child.stdout.on("data", (data) => {
      log += data.toString();
      if (log.includes("Waiting for connections")) { clearTimeout(timeout); resolve(); }
    });
    child.stderr.on("data", (data) => { log += data.toString(); });
  });
  async function stop() {
    await mongoose.disconnect();
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
  try {
    await ready;
    await mongoose.connect(`mongodb://127.0.0.1:${port}/oralscan_auth_test`);
  } catch (error) { await stop(); throw error; }
  return stop;
}
