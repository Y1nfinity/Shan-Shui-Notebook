// transition-check.js: a test for the notebook-to-shan-shui transition.
//
// How to run: serve the project folder over http (for example
// `python -m http.server 8765`), open index.html?seed=<any number>&worker=0
// (worker=0 keeps the generator on the page, where this can read it), wait for
// it to draw, then in the developer console run
//   xcroll(2000); eval(await (await fetch('tools/transition-check.js')).text())
//
// It reports, for the rules in the transition:
//   crossingsWhileVisible / overlappingStretches  rules crossing or lying on
//       top of each other while visible (should be 0)
//   samplesInsideLand / rulesThroughLand  rules running inside land that
//       stands in front of them, instead of ending at its edge (should be 0)
//   endsInEmptyPaper  rules ending where no drawing is visible yet (0)
//   waterDashesUnder40  water lines after the transition shorter than 40
//       units (dashes); ones starting exactly at the measured range's left
//       end are cut by the measurement, not real
//   kinds  how rules ended: edge (met land), range (rose into a distant
//       range), mist, water
//   handOverGap  for range/mist rules, the largest gap between the end of
//       the rule and the start of what it becomes (should be ~0)
(function () {
  // ---- land shapes: the white polylines the generator lays behind land ----
  var lands = [];
  MEM.chunks.forEach(function (c) {
    if (c.tag == "rule") return;
    var re = /<polyline points='([^']+)' style='fill:white;stroke:none/g, m;
    while ((m = re.exec(c.canv))) {
      var pts = m[1].trim().split(/\s+/).map(function (p) { return p.split(",").map(Number); });
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      var b = [Math.min.apply(null, xs), Math.max.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, ys)];
      if (b[1] < Notebook.T0 || b[0] > Notebook.T1) continue;
      lands.push({ pts: pts, b: b, tag: c.tag, base: b[3] - 40 });
    }
  });
  function inside(x, y, P) {
    var c = false, p = P.pts;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) != (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  }
  function distToEdge(x, y, P) {
    var best = Infinity, p = P.pts;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      var ax = p[j][0], ay = p[j][1], bx = p[i][0], by = p[i][1];
      var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
  }
  // ---- rule visibility (as drawn): blending rules fade over page 3 ----
  var rt = Notebook.routes();
  function alpha(r, x) {
    if (r.water) return 1;
    return 1; // no rule fades: each ends at land, or becomes a range, mist or water
  }
  // ---- 1. overlaps between neighbouring rules ----
  var crossings = 0, runs = 0, overlapLen = 0;
  for (var i = 1; i < rt.length; i++) {
    var a = rt[i - 1].pts, b = rt[i].pts, run = 0;
    for (var n = 0; n < Math.min(a.length, b.length); n++) {
      var x = a[n][0];
      var vis = alpha(rt[i - 1], x) > 0.15 && alpha(rt[i], x) > 0.15;
      if (!vis) { run = 0; continue; }
      if (b[n][1] < a[n][1] - 0.01) crossings++;
      if (Math.abs(b[n][1] - a[n][1]) < 1.5) { run += 5; overlapLen += 5; if (run == 10) runs++; } else run = 0;
    }
  }
  // ---- 2. rules running through visible land ----
  var through = 0, throughRules = new Set(), occludedPast = 0;
  rt.forEach(function (r, i) {
    var entered = false;
    r.pts.forEach(function (p) {
      var x = p[0], y = p[1];
      if (alpha(r, x) < 0.15 || Notebook.reveal(x) < 0.2) return;
      for (var k = 0; k < lands.length; k++) {
        var L = lands[k];
        if (x < L.b[0] || x > L.b[1] || y < L.b[2] || y > L.b[3]) continue;
        // only land in front of the rule counts (the rule is at or above its base)
        if (y <= L.base + 5 && inside(x, y, L) && distToEdge(x, y, L) > 2.5) {
          through++; throughRules.add(i);
          break;
        }
      }
    });
  });
  // ---- 3. ends in empty paper ----
  var emptyEnds = rt.filter(function (r) {
    var e = r.pts[r.pts.length - 1][0];
    return e < Notebook.T1 - 1 && Notebook.reveal(e) < 0.3;
  }).length;
  // ---- 4. water lines after the transition: no short dashes ----
  var byRow = {};
  MEM.chunks.forEach(function (c) {
    if (c.tag != "rule" || c.x < Notebook.T1 + 400) return;
    var re = /d='M([\d.]+) ([\d.]+)((?: L[\d.]+ [\d.]+)*)'/g, m;
    while ((m = re.exec(c.canv))) {
      var xs = m[0].match(/[ML]([\d.]+) /g).map(function (t) { return parseFloat(t.slice(1)); });
      (byRow[m[2]] = byRow[m[2]] || []).push([xs[0], xs[xs.length - 1]]);
    }
  });
  var shortReaches = 0, reaches = 0;
  Object.keys(byRow).forEach(function (k) {
    var r = byRow[k].sort(function (a, b) { return a[0] - b[0]; }), merged = [];
    r.forEach(function (seg) {
      var last = merged[merged.length - 1];
      if (last && seg[0] - last[1] < 0.5) last[1] = Math.max(last[1], seg[1]);
      else merged.push(seg.slice());
    });
    merged.forEach(function (seg) {
      reaches++;
      if (seg[1] - seg[0] < 40) shortReaches++;
    });
  });
  var kinds = {};
  rt.forEach(function (r) { kinds[r.kind] = (kinds[r.kind] || 0) + 1; });
  return {
    seed: SEED,
    contacts: rt.filter(function (r) { return r.contact != null; }).length,
    kinds: kinds,
    landShapes: lands.length,
    crossingsWhileVisible: crossings,
    overlappingStretches: runs,
    overlapLength: overlapLen,
    samplesInsideLand: through,
    rulesThroughLand: throughRules.size,
    endsInEmptyPaper: emptyEnds,
    handOverGap: Math.max.apply(null, [0].concat(rt.map(function (r, i) {
      if (r.kind != "range" && r.kind != "mist") return 0;
      var e = r.pts[r.pts.length - 1];
      return Math.abs(e[1] - (Notebook.R0 + i * Notebook.SP));
    }))),
    waterReaches: reaches,
    waterDashesUnder40: shortReaches,
  };
})();
