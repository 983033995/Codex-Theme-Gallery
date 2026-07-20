# Codex Theme Gallery

Codex Theme Gallery 是 Codex Theme Studio 的独立社区资源仓库，负责托管、审核和发布主题包、宠物包、预览图、统计信息与 `registry-v1.json`。

## 与 App 仓库的边界

- [`Codex-Theme-Studio`](https://github.com/983033995/Codex-Theme-Studio)：macOS 菜单栏 App、安装器、主题切换与 GitHub 投稿客户端。
- `Codex-Theme-Gallery`：社区内容、包规范、JSON Schema、CI 审核、Release 与 registry。

两个仓库共同位于本地生态根目录 `Codex-Theme-Ecosystem/`，但拥有独立 Git 历史和独立发布节奏。

## 内容结构

```text
packages/
├── themes/<id>/<version>/
└── pets/<id>/<version>/
registry/
├── registry-v1.json
└── schema/
stats/
skills/
└── craft-codex-theme/
```

## 元数据原则

- `theme.json` / `pet.json` 保存创作者、分享者、创作时间和许可证等不可变事实。
- `registry-v1.json` 保存发布时间、Release 地址、下载量和收藏量等可更新信息。
- 下载量以主题或宠物 GitHub Release 主资源的 `download_count` 为准。
- 收藏量以对应 GitHub 收藏 Issue 的 `heart` 与 `+1` reactions 去重统计为准。

## 本地验证

```bash
npm test
node scripts/validate-package.mjs packages/themes/fortune-coder/1.0.0
node scripts/build-registry.mjs --repo 983033995/Codex-Theme-Gallery --ref main
```

## 投稿流程

1. 使用 Theme Studio 的“贡献主题/宠物”功能选择本地包。
2. App 完成本地 Schema、图片尺寸、哈希与许可检查。
3. App 使用用户自己的 GitHub 身份创建 Fork、分支和 Pull Request。
4. GitHub Actions 自动验证内容；维护者审核视觉质量和发布权。
5. 合并后自动创建不可变 Release、刷新统计并生成 registry。

详细要求见 [内容包规范](docs/package-spec.md) 与 [registry 规范](docs/registry-spec.md)。

## 首个主题

`fortune-coder@1.0.0` 是从财神主题真实制作过程整理出的首个完整示例。复用流程见 [`craft-codex-theme`](skills/craft-codex-theme/SKILL.md)。
