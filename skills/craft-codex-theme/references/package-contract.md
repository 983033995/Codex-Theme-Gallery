# Gallery 包契约

## 必需事实

- `id`：唯一 kebab-case。
- `version`：SemVer，不覆盖已发布版本。
- `author`：原作者。
- `sharedBy`：提交 Gallery 的 GitHub 用户。
- `createdAt`：ISO 8601。
- `license`：SPDX 或 `LicenseRef-*`。
- `description`：说明视觉与功能范围。

## 主题根文件

- `theme.json`
- 背景图
- 推荐：`preview`、`tokens.json`、`decorations.json`、`README.md`、`LICENSE`

## 平台统计

下载量、收藏量、发布时间与收藏 Issue 属于 `registry-v1.json` 和 `stats/*.json`，不能由投稿包自行声明。

## 安全边界

禁止脚本、二进制、动态库、远程 URL 资产、绝对路径、`..`、符号链接、遥测代码和凭证。
