# UUBench

**Understanding the Unspoken toward Full-Duplex Multimodal Interaction**

A bilingual static website with a nine-system leaderboard, a comparison-arena preview, and benchmark methodology.

Website: https://yepan2.github.io/UUBench/

## Local preview

No installation or build is required. Serve the static files:

```sh
python3 -m http.server 18643 --bind 127.0.0.1 --directory dist
```

Then visit http://127.0.0.1:18643/.

## Files

- `dist/index.html`: HTML shell and page metadata.
- `dist/app.js`: bilingual views, navigation, filters, comparison, and CSV export.
- `dist/data.js`: system configurations, JEV 1.14.0 scores, latency notes, and illustrative scenarios.
- `dist/styles.css`: responsive styles; Google Fonts is optional and has local fallbacks.
- `dist/favicon.svg`: UUBench icon.
- `.github/workflows/pages.yml`: automatic GitHub Pages deployment.

## Updating the website

Edit files in `dist/`, commit the changes, and push to `main`. GitHub Actions deploys the contents of `dist/` to GitHub Pages. Changes normally become visible after the deployment workflow completes.

```sh
git add dist
git commit -m "Update UUBench website"
git push origin main
```

## Current content

The leaderboard contains five closed-source systems and four open-source composite configurations, with JEV 1.14.0 means on 216 paired inputs. Primitive means use applicable inputs only. The four open-source entries share Qwen3-Omni responses and use different avatar backends. The site records these configuration distinctions and the different latency measurement conventions.

The comparison arena uses illustrative scenarios and media placeholders. Its demo choices stay in the current browser tab and are not collected by a server. Paper, dataset, and evaluation-code links remain release placeholders in this version.
