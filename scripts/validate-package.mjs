#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const manifestOnly = process.argv.includes("--manifest-only");
const directoryArg = process.argv.slice(2).find((value) => !value.startsWith("--"));
if (!directoryArg) {
  throw new Error("用法：validate-package.mjs [--manifest-only] <包目录>");
}

const directory = path.resolve(directoryArg);
const themePath = path.join(directory, "theme.json");
const petPath = path.join(directory, "pet.json");
const hasTheme = fs.existsSync(themePath);
const hasPet = fs.existsSync(petPath);
if (hasTheme === hasPet) {
  throw new Error("包目录必须且只能包含 theme.json 或 pet.json 之一。");
}

const manifestPath = hasTheme ? themePath : petPath;
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const idPattern = /^[a-z0-9][a-z0-9-]{1,63}$/;
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const githubUserPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const forbiddenExtensions = new Set([
  ".app", ".bat", ".command", ".dylib", ".exe", ".js", ".mjs", ".ps1", ".sh", ".so"
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safePath(value, { nested = false } = {}) {
  assert(typeof value === "string" && value.length > 0, "资源路径不能为空。");
  assert(!path.isAbsolute(value) && !value.includes("\\"), `资源路径不安全：${value}`);
  const normalized = path.posix.normalize(value);
  assert(normalized === value && !normalized.startsWith("../") && normalized !== "..", `资源路径不安全：${value}`);
  if (!nested) assert(path.posix.basename(value) === value, `资源必须位于包根目录：${value}`);
  return value;
}

function validateCommon() {
  assert(manifest.schemaVersion === 1, "schemaVersion 必须为 1。");
  assert(idPattern.test(manifest.id ?? ""), "ID 必须是 2～64 位小写 kebab-case。");
  assert(versionPattern.test(manifest.version ?? ""), "version 必须符合 SemVer。");
  for (const key of ["description", "author", "sharedBy", "createdAt", "license"]) {
    assert(typeof manifest[key] === "string" && manifest[key].trim(), `缺少必填字段：${key}`);
  }
  assert(githubUserPattern.test(manifest.sharedBy), "sharedBy 必须是有效 GitHub 用户名。");
  assert(Number.isFinite(Date.parse(manifest.createdAt)), "createdAt 必须是 ISO 8601 时间。");
}

function walk(current) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    const stat = fs.lstatSync(fullPath);
    assert(!stat.isSymbolicLink(), `包内禁止符号链接：${path.relative(directory, fullPath)}`);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile()) {
      assert(!forbiddenExtensions.has(path.extname(entry.name).toLowerCase()), `包内禁止可执行内容：${entry.name}`);
    }
  }
}

function imageDimensions(file) {
  const data = fs.readFileSync(file);
  if (data.subarray(1, 4).toString("ascii") === "PNG") {
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
  if (["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"))) {
    return [data.readUInt16LE(6), data.readUInt16LE(8)];
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) { offset += 1; continue; }
      const marker = data[offset + 1];
      const length = data.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return [data.readUInt16BE(offset + 7), data.readUInt16BE(offset + 5)];
      }
      offset += 2 + length;
    }
  }
  if (data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP") {
    const chunk = data.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") return [1 + data.readUIntLE(24, 3), 1 + data.readUIntLE(27, 3)];
    if (chunk === "VP8L") {
      const bits = data.readUInt32LE(21);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    if (chunk === "VP8 ") {
      for (let index = 20; index + 9 < data.length; index += 1) {
        if (data[index] === 0x9d && data[index + 1] === 0x01 && data[index + 2] === 0x2a) {
          return [data.readUInt16LE(index + 3) & 0x3fff, data.readUInt16LE(index + 5) & 0x3fff];
        }
      }
    }
  }
  throw new Error(`无法读取图片尺寸：${path.basename(file)}`);
}

function validateImage(relativePath, maxBytes, requiredSize) {
  const safe = safePath(relativePath, { nested: relativePath.includes("/") });
  const file = path.join(directory, safe);
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `缺少图片：${safe}`);
  const size = fs.statSync(file).size;
  assert(size > 0 && size <= maxBytes, `图片大小超出限制：${safe}`);
  const [width, height] = imageDimensions(file);
  assert(width > 0 && height > 0 && width <= 16_384 && height <= 16_384, `图片尺寸无效：${safe}`);
  assert(width * height <= 50_000_000, `图片总像素超过 5000 万：${safe}`);
  if (requiredSize) assert(width === requiredSize[0] && height === requiredSize[1], `${safe} 必须是 ${requiredSize[0]}×${requiredSize[1]}。`);
}

function validateJSONAsset(name) {
  if (!name) return null;
  const safe = safePath(name);
  const file = path.join(directory, safe);
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `缺少 JSON 资源：${safe}`);
  assert(fs.statSync(file).size <= 1024 * 1024, `JSON 资源过大：${safe}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

validateCommon();
if (!manifestOnly) walk(directory);

if (hasTheme) {
  assert(typeof manifest.name === "string" && manifest.name.trim(), "主题缺少 name。");
  assert(/\.(png|jpe?g|webp|gif)$/i.test(manifest.image ?? ""), "主题背景格式不受支持。");
  if (!manifestOnly) validateImage(manifest.image, 16 * 1024 * 1024);
  if (manifest.preview && !manifestOnly) validateImage(manifest.preview, 16 * 1024 * 1024);
  const tokens = validateJSONAsset(manifest.tokens);
  if (tokens) {
    for (const [key, value] of Object.entries(tokens)) {
      assert(typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value), `tokens.${key} 必须是 6 位十六进制颜色。`);
    }
  }
  const decorations = validateJSONAsset(manifest.decorations);
  if (decorations && !manifestOnly) {
    for (const value of Object.values(decorations)) validateImage(value, 16 * 1024 * 1024);
  }
} else {
  assert(typeof manifest.displayName === "string" && manifest.displayName.trim(), "宠物缺少 displayName。");
  assert(manifest.spriteVersionNumber === 2, "spriteVersionNumber 必须为 2。");
  assert(manifest.spritesheetPath === "spritesheet.webp", "V2 图集必须命名为 spritesheet.webp。");
  const atlas = manifest.atlas ?? {};
  assert(atlas.columns === 8 && atlas.rows === 11 && atlas.cellWidth === 192 && atlas.cellHeight === 208, "宠物 atlas 必须为 8×11，单格 192×208。");
  if (!manifestOnly) validateImage("spritesheet.webp", 32 * 1024 * 1024, [1536, 2288]);
  if (manifest.preview && !manifestOnly) validateImage(manifest.preview, 16 * 1024 * 1024);
}

console.log(`PASS: ${manifest.id}@${manifest.version}`);
