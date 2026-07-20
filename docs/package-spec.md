# Codex Theme Gallery 内容包规范 v1

## 设计目标

内容包必须可审计、可复现、不可执行，并同时支持本地导入、GitHub Release 发布和 Theme Studio 远程安装。

## 通用字段

| 字段 | 类型 | 要求 |
| --- | --- | --- |
| `schemaVersion` | integer | 当前固定为 `1` |
| `id` | string | 2～64 位小写 kebab-case，发布后不得复用 |
| `version` | string | SemVer |
| `author` | string | 原始创作者或团队 |
| `sharedBy` | string | 将内容提交到 Gallery 的 GitHub 用户名 |
| `createdAt` | string | ISO 8601 创作完成时间 |
| `license` | string | SPDX identifier 或 `LicenseRef-*` |
| `description` | string | 清楚描述主题或宠物，不写营销口号 |

`author` 与 `sharedBy` 不一定相同。代为分享时必须保留原作者，并取得发布许可。

下载量、收藏量和正式发布时间属于动态平台数据，不能写进内容包，由 registry 自动生成。

## 主题包 v1

```text
fortune-coder/
├── theme.json
├── background.jpg
├── preview.png
├── tokens.json
├── decorations.json
├── assets/
│   ├── hero-cutout.png
│   ├── hero-parchment.png
│   ├── project-bag-collapsed.png
│   └── project-bag-expanded.png
├── README.md
└── LICENSE
```

最小 `theme.json`：

```json
{
  "schemaVersion": 1,
  "id": "fortune-coder",
  "name": "财神打工",
  "version": "1.0.0",
  "description": "红金财神主题",
  "author": "Codex Theme Studio Community",
  "sharedBy": "github-user",
  "createdAt": "2026-07-20T00:00:00Z",
  "license": "CC-BY-4.0",
  "minEngineVersion": "1.3.0",
  "image": "background.jpg",
  "preview": "preview.png",
  "appearance": "light",
  "tokens": "tokens.json",
  "decorations": "decorations.json"
}
```

### 图片要求

- 背景支持 PNG、JPEG、WebP、GIF，最大 16 MiB。
- 最大边长 16384 px，总像素不超过 5000 万。
- 推荐 2560×1440 或更高的 16:9 图像。
- `preview` 推荐 16:10 或 16:9，必须展示真实 Codex 效果。
- GIF 必须低干扰循环，并提供减少动态效果时可用的静态首帧。
- 不允许把虚假按钮、输入框或不可操作 UI 烘焙进背景图。

### `tokens.json`

保存可声明式应用的颜色和层级，不允许远程 URL、CSS 函数或任意代码：

```json
{
  "surface": "#FFF9EA",
  "surfaceStrong": "#F7E8BF",
  "accent": "#B5261E",
  "accentSecondary": "#D6A62E",
  "text": "#3A2119",
  "textMuted": "#77584A",
  "border": "#D9B66F",
  "selection": "#F1D58B"
}
```

### `decorations.json`

只允许引用包内相对路径，由 Provider 映射到预先定义的安全插槽；禁止 JavaScript、任意 CSS 和远程资源：

```json
{
  "homeHero": "assets/hero-cutout.png",
  "homeParchment": "assets/hero-parchment.png",
  "projectCollapsed": "assets/project-bag-collapsed.png",
  "projectExpanded": "assets/project-bag-expanded.png"
}
```

## 宠物包 v2 图集

宠物 manifest 仍使用 `schemaVersion: 1`，动画图集协议使用 `spriteVersionNumber: 2`：

```json
{
  "schemaVersion": 1,
  "id": "lucky-lion",
  "displayName": "招财醒狮",
  "version": "1.0.0",
  "description": "Codex 桌面宠物",
  "author": "Artist Name",
  "sharedBy": "github-user",
  "createdAt": "2026-07-20T00:00:00Z",
  "license": "CC-BY-4.0",
  "spriteVersionNumber": 2,
  "spritesheetPath": "spritesheet.webp",
  "preview": "preview.webp",
  "atlas": {
    "columns": 8,
    "rows": 11,
    "cellWidth": 192,
    "cellHeight": 208
  }
}
```

- `spritesheet.webp` 必须为 1536×2288。
- 共 8×11 格，每格 192×208。
- 动作和 16 方向语义按 Gallery 的 V2 校验规则执行。
- 图集最大 32 MiB，不允许空白必需帧、白底、越格或跨动作形象漂移。

## 安全规则

- manifest、tokens 和 decorations 必须为 UTF-8 JSON。
- 相对路径不得包含绝对路径、`..`、符号链接或包外引用。
- 包内禁止脚本、二进制、动态库、安装器、宏和远程执行配置。
- 所有正式下载都要通过 registry 的 SHA-256 与字节数验证。
