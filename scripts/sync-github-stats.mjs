#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repository = process.env.GITHUB_REPOSITORY ?? "983033995/Codex-Theme-Gallery";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required.");

async function github(endpoint) {
  const response = await fetch(`https://api.github.com/repos/${repository}${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) throw new Error(`${endpoint}: GitHub returned ${response.status}`);
  return response.json();
}

for (const name of fs.readdirSync(path.join(root, "stats")).filter((value) => value.endsWith(".json"))) {
  const file = path.join(root, "stats", name);
  const stats = JSON.parse(fs.readFileSync(file, "utf8"));
  const themePath = path.join(root, "packages/themes", stats.id, stats.version, "theme.json");
  const petPath = path.join(root, "packages/pets", stats.id, stats.version, "pet.json");
  const isTheme = fs.existsSync(themePath);
  const manifestPath = isTheme ? themePath : petPath;
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing package for ${stats.id}@${stats.version}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const tag = `${isTheme ? "theme" : "pet"}-${stats.id}-v${stats.version}`;
  const release = await github(`/releases/tags/${encodeURIComponent(tag)}`);
  const primaryName = isTheme ? manifest.image : manifest.spritesheetPath;
  stats.downloads = release.assets.find((asset) => asset.name === primaryName)?.download_count ?? 0;

  if (Number.isInteger(stats.statsIssueNumber)) {
    const reactions = await github(`/issues/${stats.statsIssueNumber}/reactions?per_page=100`);
    const users = new Set(reactions.filter((reaction) => reaction.content === "heart" || reaction.content === "+1").map((reaction) => reaction.user?.login).filter(Boolean));
    stats.favorites = users.size;
  }
  stats.updatedAt = new Date().toISOString();
  fs.writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`UPDATED: ${stats.id} downloads=${stats.downloads} favorites=${stats.favorites}`);
}
