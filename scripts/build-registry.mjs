#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const repository = argumentValue("--repo", process.env.GITHUB_REPOSITORY ?? "983033995/Codex-Theme-Gallery");
const ref = argumentValue("--ref", process.env.GITHUB_SHA ?? "main");
const output = path.resolve(argumentValue("--output", path.join(root, "registry/registry-v1.json")));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function releaseURL(tag, name) {
  return `https://github.com/${repository}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

function sourceURL(relativePath) {
  return `https://github.com/${repository}/tree/${ref}/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function versions(kind) {
  const base = path.join(root, "packages", kind);
  if (!fs.existsSync(base)) return [];
  const manifestName = kind === "themes" ? "theme.json" : "pet.json";
  const results = [];
  for (const id of fs.readdirSync(base)) {
    const idRoot = path.join(base, id);
    if (!fs.statSync(idRoot).isDirectory()) continue;
    for (const version of fs.readdirSync(idRoot)) {
      const directory = path.join(idRoot, version);
      const manifestPath = path.join(directory, manifestName);
      if (fs.existsSync(manifestPath)) results.push({ directory, manifestPath, manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) });
    }
  }
  return results;
}

function statsFor(manifest) {
  const file = path.join(root, "stats", `${manifest.id}.json`);
  const stats = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return {
    publishedAt: stats.publishedAt ?? manifest.createdAt,
    updatedAt: stats.updatedAt ?? stats.publishedAt ?? manifest.createdAt,
    downloads: Number.isInteger(stats.downloads) ? stats.downloads : 0,
    favorites: Number.isInteger(stats.favorites) ? stats.favorites : 0,
    statsIssueNumber: Number.isInteger(stats.statsIssueNumber) ? stats.statsIssueNumber : null
  };
}

function common(manifest, kind, stats) {
  const releaseTag = `${kind}-${manifest.id}-v${manifest.version}`;
  return {
    id: manifest.id,
    name: manifest.name ?? manifest.displayName,
    version: manifest.version,
    summary: manifest.description,
    author: manifest.author,
    sharedBy: manifest.sharedBy,
    license: manifest.license,
    createdAt: manifest.createdAt,
    publishedAt: stats.publishedAt,
    updatedAt: stats.updatedAt,
    releaseTag,
    previewURL: manifest.preview ? releaseURL(releaseTag, manifest.preview) : null,
    statsIssueURL: stats.statsIssueNumber ? `https://github.com/${repository}/issues/${stats.statsIssueNumber}` : null,
    stats: { downloads: stats.downloads, favorites: stats.favorites }
  };
}

const themes = versions("themes").map(({ directory, manifestPath, manifest }) => {
  const stats = statsFor(manifest);
  const releaseTag = `theme-${manifest.id}-v${manifest.version}`;
  const imagePath = path.join(directory, manifest.image);
  return {
    ...common(manifest, "theme", stats),
    minEngineVersion: manifest.minEngineVersion ?? null,
    themeConfigURL: releaseURL(releaseTag, "theme.json"),
    imageURL: releaseURL(releaseTag, manifest.image),
    themeSHA256: sha256(manifestPath),
    imageSHA256: sha256(imagePath),
    themeBytes: fs.statSync(manifestPath).size,
    imageBytes: fs.statSync(imagePath).size,
    sourceURL: sourceURL(path.relative(root, directory))
  };
});

const pets = versions("pets").map(({ directory, manifestPath, manifest }) => {
  const stats = statsFor(manifest);
  const releaseTag = `pet-${manifest.id}-v${manifest.version}`;
  const spritePath = path.join(directory, manifest.spritesheetPath);
  return {
    ...common(manifest, "pet", stats),
    petConfigURL: releaseURL(releaseTag, "pet.json"),
    spritesheetURL: releaseURL(releaseTag, manifest.spritesheetPath),
    petSHA256: sha256(manifestPath),
    spritesheetSHA256: sha256(spritePath),
    petBytes: fs.statSync(manifestPath).size,
    spritesheetBytes: fs.statSync(spritePath).size,
    sourceURL: sourceURL(path.relative(root, directory))
  };
});

themes.sort((left, right) => left.id.localeCompare(right.id));
pets.sort((left, right) => left.id.localeCompare(right.id));
const document = { schemaVersion: 1, generatedAt: new Date().toISOString(), themes, pets };
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`WROTE: ${path.relative(root, output)} (${themes.length} themes, ${pets.length} pets)`);
