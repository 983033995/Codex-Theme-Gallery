# 贡献指南

## 通过 Theme Studio 投稿

推荐使用 App 内的“贡献主题/宠物”入口。App 会在上传前校验包结构，并使用贡献者自己的 GitHub 账号创建 Fork 与 Pull Request。维护者账号令牌不会写入桌面 App。

## 手动投稿

1. Fork 本仓库。
2. 将包放到 `packages/themes/<id>/<version>/` 或 `packages/pets/<id>/<version>/`。
3. 运行 `node scripts/validate-package.mjs <包目录>`。
4. 运行 `npm test`。
5. 提交 Pull Request，并完成权利声明清单。

投稿者不要手工编辑 `registry/registry-v1.json`；合并后的发布工作流会根据包和统计文件生成它。

## 审核要求

- ID 必须唯一，版本必须递增且符合 SemVer。
- 必须填写创作者、分享者、创作时间和 SPDX 许可证。
- 必须拥有背景、字体、Logo、肖像、角色和音视频素材的发布权。
- 不接受脚本、可执行文件、动态库、遥测代码、API Key 或用户数据。
- 下载量和收藏量只能由自动化流程写入，投稿者不得自行声明。

## 提交格式

```text
feat(theme): add fortune-coder 1.0.0
feat(pet): add lucky-lion 1.0.0
fix(registry): correct immutable asset metadata
```
