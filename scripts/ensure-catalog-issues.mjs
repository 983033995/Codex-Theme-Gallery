#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repository = process.env.GITHUB_REPOSITORY ?? "983033995/Codex-Theme-Gallery";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required.");

function compareVersions(left, right) {
  const parse = (value) => {
    const [core, prerelease] = value.split("-", 2);
    return { core: core.split(".").map(Number), prerelease: prerelease ?? null };
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a.core[index] ?? 0) - (b.core[index] ?? 0);
    if (difference !== 0) return difference;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === null) return 1;
  if (b.prerelease === null) return -1;
  return a.prerelease.localeCompare(b.prerelease);
}

function latestPackages() {
  const packages = new Map();
  for (const kind of ["themes", "pets"]) {
    const manifestName = kind === "themes" ? "theme.json" : "pet.json";
    const base = path.join(root, "packages", kind);
    if (!fs.existsSync(base)) continue;
    for (const id of fs.readdirSync(base)) {
      const idRoot = path.join(base, id);
      if (!fs.statSync(idRoot).isDirectory()) continue;
      for (const version of fs.readdirSync(idRoot)) {
        const directory = path.join(idRoot, version);
        const manifestPath = path.join(directory, manifestName);
        if (!fs.existsSync(manifestPath)) continue;
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const candidate = { kind, directory, manifest, manifestPath };
        const existing = packages.get(manifest.id);
        if (!existing || compareVersions(manifest.version, existing.manifest.version) > 0) {
          packages.set(manifest.id, candidate);
        }
      }
    }
  }
  return [...packages.values()].sort((left, right) => left.manifest.id.localeCompare(right.manifest.id));
}

async function github(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`${endpoint}: GitHub returned ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

for (const { kind, manifest } of latestPackages()) {
  const file = path.join(root, "stats", `${manifest.id}.json`);
  const stats = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : {
        id: manifest.id,
        version: manifest.version,
        publishedAt: manifest.createdAt,
        downloads: 0,
        favorites: 0
      };
  if (stats.id !== manifest.id) throw new Error(`Stats ID mismatch in ${path.basename(file)}`);
  stats.version = manifest.version;
  stats.publishedAt ??= manifest.createdAt;
  stats.downloads = Number.isInteger(stats.downloads) ? stats.downloads : 0;
  stats.favorites = Number.isInteger(stats.favorites) ? stats.favorites : 0;
  if (Number.isInteger(stats.statsIssueNumber)) {
    fs.writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
    continue;
  }
  const issue = await github("/issues", {
    method: "POST",
    body: JSON.stringify({
      title: `[收藏] ${manifest.name ?? manifest.displayName} · ${stats.id}`,
      body: `这是 **${manifest.name ?? manifest.displayName}** 的收藏计数页。\n\n如果你喜欢这个${kind === "themes" ? "主题" : "宠物"}，请为本 Issue 添加 ❤️ 或 👍 reaction。Theme Studio 会把去重后的 reaction 数量显示为收藏量。\n\n- ID: \`${stats.id}\`\n- Version: \`${stats.version}\`\n- Author: ${manifest.author}\n- Shared by: @${manifest.sharedBy}`,
      labels: ["catalog-item"]
    })
  });
  stats.statsIssueNumber = issue.number;
  stats.updatedAt = new Date().toISOString();
  fs.writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`CREATED: issue #${issue.number} for ${stats.id}`);
}
