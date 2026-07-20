#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(script, args) {
  execFileSync(node, [path.join(root, "scripts", script), ...args], { cwd: root, stdio: "inherit" });
}

for (const kind of ["themes", "pets"]) {
  const base = path.join(root, "packages", kind);
  if (!fs.existsSync(base)) continue;
  for (const id of fs.readdirSync(base)) {
    const idRoot = path.join(base, id);
    if (!fs.statSync(idRoot).isDirectory()) continue;
    for (const version of fs.readdirSync(idRoot)) {
      const directory = path.join(idRoot, version);
      if (fs.statSync(directory).isDirectory()) run("validate-package.mjs", [directory]);
    }
  }
}

run("validate-package.mjs", ["--manifest-only", path.join(root, "registry/examples/theme-sample")]);
run("validate-package.mjs", ["--manifest-only", path.join(root, "registry/examples/pet-sample")]);

const temporary = path.join(os.tmpdir(), `codex-theme-registry-${process.pid}.json`);
try {
  run("build-registry.mjs", ["--repo", "983033995/Codex-Theme-Gallery", "--ref", "0123456789abcdef0123456789abcdef01234567", "--output", temporary]);
  run("validate-registry.mjs", [temporary]);
  for (const file of [
    "registry/schema/theme-v1.schema.json",
    "registry/schema/pet-v2.schema.json",
    "registry/schema/registry-v1.schema.json"
  ]) JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const skill = fs.readFileSync(path.join(root, "skills/craft-codex-theme/SKILL.md"), "utf8");
  if (!skill.startsWith("---\nname: craft-codex-theme\n") || skill.includes("[TODO")) {
    throw new Error("craft-codex-theme skill metadata is invalid or incomplete");
  }
} finally {
  fs.rmSync(temporary, { force: true });
}

console.log("PASS: Codex Theme Gallery");
