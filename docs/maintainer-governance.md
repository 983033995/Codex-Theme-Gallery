# Gallery 审核与发布规则

## 变更准入

所有 `main` 变更必须通过 Pull Request，并使用 Conventional Commit 风格标题，例如 `feat(pet): 发布梅西世界杯冠军`。`packages/`、`registry/`、`stats/`、`.github/` 与 `scripts/` 由 CODEOWNERS 审核。

审核人必须确认：`npm test` 通过、manifest 与资源哈希正确、许可证与素材发布权清晰、预览反映真实效果、宠物 V2 图集与动作质量可用，并且不存在可执行内容、凭证、用户数据或统计伪造。

## 自动发布

合并到 `main` 的内容包由 `publish.yml` 自动完成：创建不可变 Package Release、建立收藏 Issue、同步下载/收藏计数、生成并校验 registry。每 6 小时的 `stats.yml` 会从 GitHub Release 下载数和收藏 Issue 反应刷新统计。

## 回滚

发布资产不可覆盖。发现问题时，发布更高的修复版本；registry 自动选择最新 SemVer。若流水线生成的 registry 或统计异常，回退对应生成提交后重新运行工作流，随后验证 `registry/registry-v1.json` 与 Release 资产。
