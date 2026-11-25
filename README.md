# UUBench

**Understanding the Unspoken toward Full-Duplex Multimodal Interaction**

A bilingual static website with a nine-system leaderboard, three real case studies, and benchmark methodology.

Website: https://yepan2.github.io/UUBench/

## Local preview

No installation or build is required. Serve the static files:

```sh
python3 -m http.server 18643 --bind 127.0.0.1 --directory dist
```

Then visit http://127.0.0.1:18643/.

## Files

- `dist/index.html`: HTML shell and page metadata.
- `dist/app.js`: bilingual views, navigation, filters, case studies, and CSV export.
- `dist/data.js`: system configurations, JEV 1.14.0 scores, and latency notes.
- `dist/cases.js`: three curated inputs, complete transcripts, unspoken intents, and bilingual response analyses.
- `dist/media/cases/`: 12 original-frame videos (three human inputs and nine responses) and preview posters.
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

The case studies at `#cases` show clips 34, 39, and 43, each with a human input and responses from Emma, Tavus, and Vidu. Transcripts and user intents come from the supplied case materials. Response analyses are qualitative interpretations of the replies against those intents, not additional numeric scores. Videos retain their original frames and audio; only the MP4 container is optimized for playback. Starting a video pauses any other playing video. Legacy `#arena` links open the case studies.

Paper, dataset, and evaluation-code links remain release placeholders in this version.
