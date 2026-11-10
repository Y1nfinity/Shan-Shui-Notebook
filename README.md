# Shan Shui Notebook

**[▶ Open the live piece](https://y1nfinity.github.io/Shan-Shui-Notebook/)**

A generative scroll. It opens on a plain ruled composition-notebook page. On the next page the blue rules begin to drift in a slow, shared wave, after the warped, embroidered notebooks of Candace Hicks. Then the lines turn into an endless shan shui landscape: each rule runs on until it meets a mountain and ends at its edge, the high rules rise into distant ranges and mist, and the low ones become water. From there the scroll goes on forever. The mountains and water are drawn in the notebook's blue; the trees, houses, people and boats are in pencil. A red margin follows every fold.

The landscape is generated with [{Shan, Shui}\*](https://github.com/LingDong-/shan-shui-inf) by Lingdong Huang.

## Viewing it

- **Online:** [https://y1nfinity.github.io/Shan-Shui-Notebook/](https://y1nfinity.github.io/Shan-Shui-Notebook/)
- **A particular landscape:** add a seed, e.g. [`?seed=54592`](https://y1nfinity.github.io/Shan-Shui-Notebook/?seed=54592). The same seed always draws the same scroll; without one you get a new landscape each visit.
- **Locally:** open `index.html` in a browser, or serve the folder (`python -m http.server`) and visit `http://localhost:8000`.

Drag, or use the mouse wheel, trackpad or arrow keys, to move along the scroll. Space starts and stops auto-scroll. The ☰ menu has the seed, auto-scroll speed and "Download view as .SVG".

## URL options

| Option | Effect |
| --- | --- |
| `?seed=54592` | A particular landscape. |
| `?embed=1` | For iframes: hides the controls and turns auto-scroll on. |
| `?auto=1` / `?auto=0` | Auto-scroll on or off. |
| `?speed=60` | Auto-scroll speed in world units per second (one notebook page is 700). |
| `?ui=0` | Hides the controls. |
| `?start=2100` | Starts further along: 0 is the plain page, 2100 the start of the full scroll. |
| `?debug=1` | Shows the generator's console logging. |
| `?worker=0` | Generates on the page instead of in a background worker (slower; for testing). |

Options combine, e.g. `?embed=1&seed=54592&speed=40`.

## Embedding it

```html
<div style="position:relative; width:100%; aspect-ratio:16/7;">
  <iframe src="https://y1nfinity.github.io/Shan-Shui-Notebook/?embed=1&seed=54592"
          title="Shan Shui Notebook, a generative landscape"
          style="position:absolute; inset:0; width:100%; height:100%; border:0;"
          loading="lazy"></iframe>
</div>
```

The drawing always fits the frame's height. Inside a frame, vertical scrolling passes through to the page around it. See [`embed-example.html`](embed-example.html) for a full example.

## How it works

Everything is in one file, [`index.html`](index.html). It needs no build step, and nothing is downloaded from other sites.

- **The page and the transition.** The notebook page and its rules are drawn by the `Notebook` code. In the transition, each rule follows a route worked out in `Notebook.routes()`: it drifts in a shared wave, then runs on until it first meets land standing in front of it, rounds onto that land's outline and ends at its edge. High rules that meet nothing hand over to distant ranges or mist; low ones become water.
- **The landscape.** The landscape comes from the original {Shan, Shui}\* generators (mountains, trees, buildings, boats, people), recoloured: land and water in the notebook blue, everything drawn by hand in the original in graphite.
- **Rendering.** The scroll is drawn as page-sized tiles. A background worker generates each page and paints it onto its own canvas (a small renderer for exactly the SVG the generator writes), so the page only slides finished pictures and scrolling stays smooth.

[`tools/transition-check.js`](tools/transition-check.js) is a test for the transition: it checks that rules never cross or overlap, never run through land in front of them, and hand over cleanly.

## Process

[`versions/`](versions/) holds every stage of the piece, from the first stitched-thread draft to the current version, with notes on what changed at each step.

## Credits and license

- **Landscape generator:** [{Shan, Shui}\*](https://github.com/LingDong-/shan-shui-inf), © 2018 Lingdong Huang, used under the MIT License (see [`LICENSE`](LICENSE)). The notice is also at the top of `index.html`; keep both when copying the code.
- **Inspiration:** the embroidered composition notebooks of Candace Hicks.
