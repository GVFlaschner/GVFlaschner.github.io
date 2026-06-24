# Gotthold Fläschner Personal Website

Static personal website draft for local inspection and later GitHub Pages deployment.

## Run Locally

From this folder:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The site uses browser-side JavaScript only, so it is compatible with GitHub Pages.

## Timeline Data

Timeline entries are easiest to edit in:

```text
assets/data/timeline.csv
```

Important columns:

- `date`: what visitors see on the card
- `sort_date`: machine-readable order, ideally `YYYY-MM-DD` or `YYYY-MM`
- `year`: year shown in grouping logic
- `type`: `publication`, `talk`, `media`, `award`, `patent`, or `milestone`
- `period`: one of the career periods in `assets/data/timeline.json`
- `non_expert_title`: optional simpler title for non-expert mode
- `title`: expert/technical card or milestone title
- `place`: journal, venue, institution, or source
- `public_text`: short text for non-experts
- `expert_text`: optional more technical text shown when a card is opened
- `source_label` / `source_url`: main source link
- `source_label_2` / `source_url_2` and `source_label_3` / `source_url_3`: optional extra links
- `local_backup`: local archive path for your own records

Career period definitions and colors still live in:

```text
assets/data/timeline.json
```

Use the ignored local `archive/` folder to keep PDFs, screenshots, saved pages, or source notes for each public claim without publishing them to GitHub.

## Fonts

The site self-hosts Inter and EB Garamond in:

```text
assets/fonts/
```

These were copied from the Martin Etzrodt reference repository so the site does not depend on external font services.
