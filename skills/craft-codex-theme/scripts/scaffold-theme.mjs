#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function value(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const id = value("--id");
const name = value("--name");
const author = value("--author");
const sharedBy = value("--shared-by");
const output = path.resolve(value("--output") ?? process.cwd());
const version = value("--version") ?? "0.1.0";
if (!id || !name || !author || !sharedBy) {
  throw new Error("Required: --id --name --author --shared-by [--version] [--output]");
}
if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) throw new Error("id must be kebab-case");
const directory = path.join(output, id, version);
if (fs.existsSync(directory)) throw new Error(`Theme already exists: ${directory}`);
fs.mkdirSync(path.join(directory, "assets"), { recursive: true });

const theme = {
  schemaVersion: 1,
  id,
  name,
  version,
  description: "TODO: describe the theme",
  author,
  sharedBy,
  createdAt: new Date().toISOString(),
  license: "CC-BY-4.0",
  minEngineVersion: "1.3.0",
  image: "background.webp",
  preview: "preview.webp",
  appearance: "auto",
  tagline: "TODO",
  tokens: "tokens.json",
  decorations: "decorations.json"
};
const tokens = {
  surface: "#F7F7F7",
  surfaceStrong: "#FFFFFF",
  accent: "#3366CC",
  accentSecondary: "#88AADD",
  text: "#202020",
  textMuted: "#666666",
  border: "#CCCCCC",
  selection: "#DDE8FF"
};
fs.writeFileSync(path.join(directory, "theme.json"), `${JSON.stringify(theme, null, 2)}\n`);
fs.writeFileSync(path.join(directory, "tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`);
fs.writeFileSync(path.join(directory, "decorations.json"), "{}\n");
fs.writeFileSync(path.join(directory, "README.md"), `# ${name}\n\nTODO: describe design, rights, and QA evidence.\n`);
fs.writeFileSync(path.join(directory, "LICENSE"), "TODO: include the selected asset license text.\n");
console.log(directory);
