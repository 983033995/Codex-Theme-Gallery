#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.resolve(process.argv[2] ?? path.join(root, "registry/registry-v1.json"));
const document = JSON.parse(fs.readFileSync(file, "utf8"));
const idPattern = /^[a-z0-9][a-z0-9-]{1,63}$/;
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const hashPattern = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(`${path.relative(root, file)}: ${message}`);
}

function requireHTTPS(value, label) {
  let url;
  try { url = new URL(value); } catch { fail(`${label} 不是有效 URL。`); }
  if (url.protocol !== "https:") fail(`${label} 必须使用 HTTPS。`);
  if (/raw\.githubusercontent\.com$/i.test(url.hostname)) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 4 || ["main", "master", "HEAD"].includes(parts[2])) {
      fail(`${label} 必须指向完整 commit SHA，不能指向可变分支。`);
    }
  }
}

function validateItem(item, kind) {
  if (!idPattern.test(item.id ?? "")) fail(`${kind} ID 无效：${item.id}`);
  if (!versionPattern.test(item.version ?? "")) fail(`${item.id} 版本必须符合 SemVer。`);
  for (const key of ["name", "author", "sharedBy", "license", "createdAt", "publishedAt", "releaseTag"]) {
    if (typeof item[key] !== "string" || !item[key].trim()) fail(`${item.id} 缺少 ${key}。`);
  }
  if (!Number.isFinite(Date.parse(item.createdAt)) || !Number.isFinite(Date.parse(item.publishedAt))) {
    fail(`${item.id} 时间字段必须为 ISO 8601。`);
  }
  if (!Number.isInteger(item.stats?.downloads) || item.stats.downloads < 0 || !Number.isInteger(item.stats?.favorites) || item.stats.favorites < 0) {
    fail(`${item.id} stats 必须是非负整数。`);
  }

  const configURL = kind === "theme" ? item.themeConfigURL : item.petConfigURL;
  const assetURL = kind === "theme" ? item.imageURL : item.spritesheetURL;
  const configHash = kind === "theme" ? item.themeSHA256 : item.petSHA256;
  const assetHash = kind === "theme" ? item.imageSHA256 : item.spritesheetSHA256;
  const configBytes = kind === "theme" ? item.themeBytes : item.petBytes;
  const assetBytes = kind === "theme" ? item.imageBytes : item.spritesheetBytes;

  requireHTTPS(configURL, `${item.id} manifest URL`);
  requireHTTPS(assetURL, `${item.id} 主资源 URL`);
  if (item.previewURL) requireHTTPS(item.previewURL, `${item.id} preview URL`);
  if (item.statsIssueURL) requireHTTPS(item.statsIssueURL, `${item.id} stats issue URL`);
  if (!hashPattern.test(configHash ?? "") || !hashPattern.test(assetHash ?? "")) fail(`${item.id} SHA-256 无效。`);
  if (!Number.isInteger(configBytes) || configBytes < 1 || configBytes > 1024 * 1024) fail(`${item.id} manifest 字节数无效。`);
  const limit = kind === "theme" ? 16 * 1024 * 1024 : 32 * 1024 * 1024;
  if (!Number.isInteger(assetBytes) || assetBytes < 1 || assetBytes > limit) fail(`${item.id} 主资源字节数无效。`);
}

if (document.schemaVersion !== 1) fail("schemaVersion 必须为 1。");
if (!Number.isFinite(Date.parse(document.generatedAt))) fail("generatedAt 必须为 ISO 8601。");
if (!Array.isArray(document.themes) || !Array.isArray(document.pets)) fail("themes/pets 必须是数组。");
for (const item of document.themes) validateItem(item, "theme");
for (const item of document.pets) validateItem(item, "pet");
const ids = [...document.themes, ...document.pets].map((item) => item.id);
if (new Set(ids).size !== ids.length) fail("registry 中存在重复 ID。");

console.log(`PASS: registry contains ${document.themes.length} themes and ${document.pets.length} pets`);
