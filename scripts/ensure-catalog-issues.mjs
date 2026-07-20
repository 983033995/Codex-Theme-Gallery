#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repository = process.env.GITHUB_REPOSITORY ?? "983033995/Codex-Theme-Gallery";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required.");

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

for (const name of fs.readdirSync(path.join(root, "stats")).filter((value) => value.endsWith(".json"))) {
  const file = path.join(root, "stats", name);
  const stats = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Number.isInteger(stats.statsIssueNumber)) continue;
  const themePath = path.join(root, "packages/themes", stats.id, stats.version, "theme.json");
  const petPath = path.join(root, "packages/pets", stats.id, stats.version, "pet.json");
  const manifestPath = fs.existsSync(themePath) ? themePath : petPath;
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing package for ${stats.id}@${stats.version}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const issue = await github("/issues", {
    method: "POST",
    body: JSON.stringify({
      title: `[收藏] ${manifest.name ?? manifest.displayName} · ${stats.id}`,
      body: `这是 **${manifest.name ?? manifest.displayName}** 的收藏计数页。\n\n如果你喜欢这个${fs.existsSync(themePath) ? "主题" : "宠物"}，请为本 Issue 添加 ❤️ 或 👍 reaction。Theme Studio 会把去重后的 reaction 数量显示为收藏量。\n\n- ID: \`${stats.id}\`\n- Version: \`${stats.version}\`\n- Author: ${manifest.author}\n- Shared by: @${manifest.sharedBy}`,
      labels: ["catalog-item"]
    })
  });
  stats.statsIssueNumber = issue.number;
  stats.updatedAt = new Date().toISOString();
  fs.writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`CREATED: issue #${issue.number} for ${stats.id}`);
}
