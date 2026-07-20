---
name: craft-codex-theme
description: Create, refine, validate, and package a production-ready Codex desktop theme from a visual direction or reference. Use when making a new Codex theme, adapting an existing theme concept, fixing theme readability or layering, preparing Gallery packages, or reproducing the proven fortune-coder workflow across home, task, code, settings, sidebar, and right-panel states.
---

# Craft Codex Theme

Build themes as a complete interface system, not a background replacement. Preserve official Codex files and apply changes only through the compatible provider, declarative package assets, and Theme Studio.

## Workflow

1. Capture the target.
   - Obtain a reference image, selected visual direction, or existing theme.
   - List the intended mood, palette, mascot/hero, decorative motifs, and required Codex routes.
   - Do not begin implementation from an unselected verbal concept when visual ideation is still needed.

2. Scaffold the package.
   - Run `node scripts/scaffold-theme.mjs --id <id> --name <name> --author <author> --shared-by <github-user> --output <gallery-root>/packages/themes`.
   - Fill `theme.json`, `tokens.json`, `decorations.json`, `README.md`, and `LICENSE`.
   - Keep scripts and executable code out of the community package.

3. Create real assets.
   - Use source assets when rights are clear; otherwise generate raster assets with ImageGen.
   - Create separate transparent PNG/WebP assets for hero figures, project collapsed/expanded icons, and foreground ornaments.
   - When feature cards are theme-specific, create a cohesive raster icon family instead of reusing unrelated generic product icons.
   - Never fake decorative artwork with emoji, CSS drawings, inline SVG, or text symbols.
   - Size each asset for its actual UI slot and preserve transparent padding intentionally.

4. Define readable tokens.
   - Choose surface, text, muted text, accent, border, selection, success, and danger colors.
   - Validate sidebar, editor/code, settings, hover, selected, disabled, and diff/output states independently.
   - Treat bright background photography as hostile until every text layer has a controlled surface or shadow.

5. Implement safe UI mappings.
   - Use stable accessibility/state attributes before geometry or generated class names.
   - Map project icons from `aria-expanded`: collapsed uses the normal asset; expanded uses the animated/spraying asset.
   - Make icon hydration idempotent because the home dashboard can mount before sidebar assets exist.
   - Use named container queries for the home dashboard because Codex side panels can shrink the content column without changing the window viewport.
   - Keep Chinese action titles horizontal with sufficient grid tracks and `word-break: keep-all`; never accept one-character-per-line card text.
   - Set hover cursor and visible hover/active/focus styles for every actionable sidebar row.

6. Protect content layers.
   - Decorative corner elements must never cover file trees, diffs, output, settings, or the composer.
   - Use the right sidebar toggle's authoritative state when available; use geometry only as a legacy fallback.
   - Hide or clip the ornament when the right panel opens. Do not solve overlap by merely shifting it left.
   - Respect reduced motion for GIFs and icon transitions.

7. Verify the real app.
   - Test new-task home, historical task, code file, settings, sidebar collapsed/expanded projects, hover/focus, and right panel open/closed.
   - Confirm no document overflow and no decoration crosses the content safe boundary.
   - Restart Codex and restart macOS login components when persistence changed.
   - Capture before/after screenshots and record P0–P2 findings before release.

8. Package and publish.
   - Run the Gallery `node scripts/validate-package.mjs <package-directory>` and `npm test`.
   - Add author, `sharedBy`, `createdAt`, SPDX license, preview, and a concise rights statement.
   - Submit through a Fork and Pull Request. Do not edit generated registry statistics by hand.

## Fortune Theme Lessons

Read [references/fortune-theme-case-study.md](references/fortune-theme-case-study.md) before building a theme with a hero dashboard, custom sidebar icons, GIF motion, or foreground ornaments.

Read [references/package-contract.md](references/package-contract.md) when creating or reviewing Gallery packages.

## Acceptance Gate

- Theme is recognizable without sacrificing text contrast.
- All visible non-standard art is a real packaged asset.
- Project collapsed and expanded states are distinct.
- Home icons survive route timing and repeated mutations.
- Right-panel opening cannot be obscured by foreground decoration.
- Package validates and includes creator, sharer, time, license, preview, and immutable version.
