# GitHub registry v1 规范

## 职责

`registry/registry-v1.json` 是 Theme Studio 的社区内容入口。它由 CI 根据 `packages/` 与 `stats/` 自动生成，投稿者不得手工修改统计字段。

## 条目元数据

每个主题或宠物条目包含：

- 身份：`id`、`name`、`version`。
- 权利：`author`、`sharedBy`、`license`。
- 时间：`createdAt`、`publishedAt`、`updatedAt`。
- 发布：`releaseTag`、manifest URL、主资源 URL、预览 URL。
- 完整性：每个安装文件的 SHA-256 与字节数。
- 统计：`downloads`、`favorites`、`statsIssueURL`。

示例：

```json
{
  "id": "fortune-coder",
  "name": "财神打工",
  "version": "1.0.0",
  "author": "Codex Theme Studio Community",
  "sharedBy": "983033995",
  "createdAt": "2026-07-20T00:00:00Z",
  "publishedAt": "2026-07-20T00:00:00Z",
  "releaseTag": "theme-fortune-coder-v1.0.0",
  "stats": {
    "downloads": 0,
    "favorites": 0
  }
}
```

## 下载量

每个版本使用独立 GitHub Release。Theme Studio 安装时访问 Release 主资源，因此 GitHub Release asset 的 `download_count` 可以作为真实安装下载量。统计工作流定时读取该值并写入 `stats/<id>.json`。

## 收藏量

每个内容条目拥有一个带 `catalog-item` 标签的收藏 Issue。用户通过 `heart` 或 `+1` reaction 收藏；统计流程按 GitHub 用户去重后生成 `favorites`。未来 App 的“收藏”按钮只操作 reaction，不直接写 registry。

## 不可变发布

- 主题包：`theme-<id>-v<version>`。
- 宠物包：`pet-<id>-v<version>`。
- 已发布 Release 不得覆盖；修复必须增加 SemVer。
- registry 本身可以从 `main` 获取，但安装文件必须来自 Release asset、Git tag 或完整 commit SHA。

## 审核和撤回

- PR 必须通过 Schema、尺寸、哈希、路径、许可和敏感信息检查。
- 维护者负责视觉质量、权利声明和不当内容审核。
- 安全或权利问题可从最新 registry 撤回条目；历史记录除法律要求外不静默改写。
