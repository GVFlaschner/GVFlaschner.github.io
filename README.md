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

Timeline entries live in:

```text
assets/data/timeline.json
```

Each event can have:

- `links`: original external sources
- `localBackup`: path to a local archive folder

Use the `archive/` folder to keep PDFs, screenshots, saved pages, or source notes for each public claim.

## Fonts

The site self-hosts Inter and EB Garamond in:

```text
assets/fonts/
```

These were copied from the Martin Etzrodt reference repository so the site does not depend on external font services.
