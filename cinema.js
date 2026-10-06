/* =========================================================
   SPOTLIGHT — cinema.js (homepage)
   1. Nano-assembly: thousands of particles swarm from scattered
      fragments into the Spotlight star, then the wordmark.
   2. Projector reel: a 3D film strip flows out of a projector,
      morphs into a spinning ring; frames open a project view.
   3. Brand scanner: scans a public homepage (via /api/scan) with
      an AR-style environment scan and shows real findings.
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const visible = (el, cb, margin = "100px") => new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

  /* =======================================================
     1. NANO-ASSEMBLY
     ======================================================= */
  (function nano() {
    const sec = $("#nanotech"); if (!sec) return;
    const cv = $(".nano-canvas", sec), ctx = cv.getContext("2d");
    const steps = $$(".nano-steps li", sec), pctEl = $("[data-nano-pct]", sec), bar = $(".nano-progress i", sec);
    const COLORS = ["#FF8F3F", "#FFB25E", "#E2B451", "#F6E7C8", "#3FD6E3", "#FF8F3F", "#E2B451"];
    let W = 0, H = 0, dpr = 1, parts = [], on = false, raf = 0, mx = 0, my = 0, t0 = performance.now(), built = false;
    const count = () => (innerWidth < 700 ? 950 : innerWidth < 1200 ? 1500 : 1900);

    function sample(draw) {
      const oc = document.createElement("canvas"); oc.width = W; oc.height = H;
      const o = oc.getContext("2d"); o.fillStyle = "#fff"; draw(o);
      const d = o.getImageData(0, 0, W, H).data, pts = [];
      const n = count(), step = 2;
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 120) pts.push([x + Math.random() * step, y + Math.random() * step]);
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      return pts.length ? pts.slice(0, n) : [[W / 2, H / 2]];
    }
    function build() {
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      W = cv.clientWidth; H = cv.clientHeight; if (!W || !H) return;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = W / 2, cy = H * .44, S = Math.min(W, H) * (W < 700 ? .3 : .27);
      const star = sample(o => {
        o.beginPath(); o.moveTo(cx, cy - S);
        o.quadraticCurveTo(cx + S * .14, cy - S * .14, cx + S, cy); o.quadraticCurveTo(cx + S * .14, cy + S * .14, cx, cy + S);
        o.quadraticCurveTo(cx - S * .14, cy + S * .14, cx - S, cy); o.quadraticCurveTo(cx - S * .14, cy - S * .14, cx, cy - S); o.fill();
      });
      const fs = Math.min(W * (W < 700 ? .118 : .105), 150);
      const word = sample(o => {
        o.font = `500 ${fs}px Cinzel, "Trajan Pro", Georgia, serif`; o.textBaseline = "middle";
        const txt = "SPOTLIGHT", sp = fs * .16;
        const widths = [...txt].map(c => o.measureText(c).width), total = widths.reduce((a, b) => a + b, 0) + sp * (txt.length - 1);
        let x = cx - total / 2; [...txt].forEach((c, i) => { o.fillText(c, x, cy); x += widths[i] + sp; });
        o.fillRect(cx - total * .38, cy + fs * .72, total * .76, Math.max(2, fs * .03));
      });
      const n = count();
      parts = Array.from({ length: n }, (_, i) => {
        const fl = Math.random() < .78;
        const sy = fl ? H * (.66 + .34 * Math.pow(Math.random(), .8)) : H * Math.random() * .62;
        const z = fl ? clamp((sy - H * .62) / (H * .38)) * .85 + .15 : Math.random() * .5;
        const s = star[i % star.length], w = word[i % word.length];
        return { sx: Math.random() * W * 1.3 - W * .15, sy, z, ax: s[0], ay: s[1], bx: w[0], by: w[1], d: Math.random() * .35, c: COLORS[i % COLORS.length], ph: Math.random() * 6.28, sz: 1 + Math.random() * 1.6, g: Math.random() < .14 };
      });
      built = true;
      if (reduce) frame(performance.now(), 1);
    }
    function progress() {
      const r = sec.getBoundingClientRect();
      return clamp(-r.top / Math.max(1, r.height - innerHeight));
    }
    function frame(now, forceP) {
      if (!built) return;
      const t = (now - t0) / 1000, p = forceP ?? progress();
      const a = ease(clamp((p - .1) / .32)), b = ease(clamp((p - .52) / .3));
      ctx.clearRect(0, 0, W, H);
      // floor haze
      const g = ctx.createLinearGradient(0, H * .6, 0, H);
      g.addColorStop(0, "rgba(12,58,68,0)"); g.addColorStop(1, "rgba(12,58,68,.45)");
      ctx.fillStyle = g; ctx.fillRect(0, H * .6, W, H * .4);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        const ai = ease(clamp(a * 1.35 - q.d)), bi = ease(clamp(b * 1.35 - q.d));
        let x = lerp(q.sx, q.ax, ai), y = lerp(q.sy, q.ay, ai);
        x = lerp(x, q.bx, bi); y = lerp(y, q.by, bi);
        const sw = Math.sin(Math.PI * ai) * (1 - bi) + Math.sin(Math.PI * bi);
        x += Math.cos(t * .9 + q.ph) * 34 * sw; y += Math.sin(t * 1.1 + q.ph * 1.7) * 30 * sw - 50 * sw * (1 - q.z);
        if (ai < .02) { x += Math.sin(t * .4 + q.ph) * 2; y += Math.cos(t * .5 + q.ph) * 1.2; }
        const depth = lerp(q.z, .6, Math.max(ai, bi));
        x += mx * 22 * depth; y += my * 14 * depth;
        const s = q.sz * (.7 + depth * 1.7) * (W < 700 ? .85 : 1) * (1 + bi * .35);
        const assembled = Math.max(ai, bi);
        const shimmer = assembled > .95 ? .75 + .25 * Math.sin(t * 3 + q.ph) : 1;
        ctx.globalAlpha = (.35 + .55 * (assembled * .6 + depth * .4)) * shimmer;
        ctx.fillStyle = assembled > .6 && i % 3 ? "#F2C978" : q.c;
        ctx.fillRect(x, y, s, s);
        if (q.g) { ctx.globalAlpha *= .18; ctx.fillRect(x - s * 1.5, y - s * 1.5, s * 4, s * 4); }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      const stage = p < .36 ? 0 : p < .66 ? 1 : 2;
      steps.forEach((s, i) => s.classList.toggle("on", i === stage));
      if (pctEl) pctEl.textContent = String(Math.round(((a + b) / 2) * 100)).padStart(3, "0") + "%";
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (on && forceP === undefined) raf = requestAnimationFrame(frame);
    }
    const start = () => { if (on || reduce) return; on = true; raf = requestAnimationFrame(frame); };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    visible(sec, v => (v ? start() : stop()), "50px");
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    if (fine && !reduce) sec.addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    (document.fonts && document.fonts.load ? document.fonts.load('500 80px Cinzel').catch(() => {}) : Promise.resolve()).then(build);
    if (reduce) { steps.forEach(s => s.classList.add("on")); }
  })();

  /* =======================================================
     2. PROJECTOR REEL + PROJECT VIEW
     ======================================================= */
  (function reel() {
    const stage = $("[data-reel]"); if (!stage) return;
    const strip = $("[data-strip]", stage), frames = $$(".frame", strip), N = frames.length;
    const proj = $(".projector", stage), lens = $(".projector .lens-glass", stage);
    const sec = stage.closest("section"), flowItems = $$(".reel-flow li", sec);
    const modeBtns = $$("[data-reel-mode]", sec);
    let W = 0, H = 0, fw = 200, fh = 150, step = 210, L = { x: 0, y: 0 }, C = { x: 0, y: 0 }, R = 300;
    let running = false, raf = 0, last = performance.now(), time = 0, speed = 1, targetSpeed = 1;
    let emerged = 1.2, mode = "idle", m = 0, mTarget = 0, phi = 0, auto = true, autoClock = 0, hover = -1, drag = null, played = false;

    const setFlow = i => flowItems.forEach((li, k) => li.classList.toggle("on", k === i));
    function measure() {
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      const small = W < 700;
      fw = small ? 132 : 200; fh = Math.round(fw * .75) + 26; step = fw + 10;
      stage.style.setProperty("--fw", fw + "px"); stage.style.setProperty("--fh", fh + "px");
      const lr = lens.getBoundingClientRect();
      L = { x: lr.left - r.left + lr.width * .6, y: lr.top - r.top + lr.height / 2 };
      C = { x: small ? W * .5 : W * .6, y: small ? H * .6 : H * .5 };
      R = Math.min((N * step) / (2 * Math.PI), small ? W * .46 : W * .3, H * .9);
    }
    const tiltX = -14 * Math.PI / 180, tiltZ = -7 * Math.PI / 180;
    function ringPose(i) {
      const th = (i / N) * Math.PI * 2 + phi;
      let x = R * Math.sin(th), y = 0, z = R * Math.cos(th);
      // tilt: rotate around X then Z
      let y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX), z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
      let x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ), y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
      let deg = (th * 180 / Math.PI) % 360; if (deg > 180) deg -= 360; if (deg < -180) deg += 360;
      return { x: C.x + x2, y: C.y + y2, z: z1 - R * .35, rz: tiltZ * 57.3, rx: tiltX * 57.3, ry: deg, dim: .45 + .55 * (Math.cos(th) * .5 + .5) };
    }
    function ribbonPose(i) {
      const u = i * step + 40;
      const k = (2 * Math.PI) / (W < 700 ? 620 : 980), w = time * 1.1;
      const amp = Math.min(1, u / 520) * (W < 700 ? 46 : 80);
      const small = W < 700;
      const x = L.x + u * (small ? .62 : .9);
      const y = L.y + amp * Math.sin(k * u - w) + (small ? Math.min(u, 700) * .3 : -Math.min(1, u / 700) * 50);
      const dy = amp * k * Math.cos(k * u - w);
      const z = Math.min(1, u / 380) * 110 * Math.sin(k * .7 * u - w * .8);
      const dz = Math.min(1, u / 380) * 110 * k * .7 * Math.cos(k * .7 * u - w * .8);
      return { x, y, z, rz: Math.atan2(dy * .9, .9) * 57.3, rx: 22 * Math.sin(k * .5 * u - w * .6), ry: -Math.atan2(dz, .9) * 57.3 * .8, dim: .75 + .25 * Math.cos(k * u - w) };
    }
    function frame(now) {
      const dt = Math.min(50, now - last) / 1000; last = now;
      speed = lerp(speed, targetSpeed, .08);
      time += dt * speed;
      if (mode !== "idle" && emerged < N + 1) emerged += dt * 4.2;
      if (!drag) phi += dt * .32 * speed;
      m = lerp(m, mTarget, .045);
      if (auto && mode !== "idle") {
        autoClock += dt;
        if (mTarget === 0 && autoClock > (W < 700 ? 3.2 : 7)) { mTarget = 1; autoClock = 0; setFlow(2); }
        else if (mTarget === 1 && autoClock > 9) { mTarget = 0; autoClock = 0; setFlow(1); }
      }
      frames.forEach((f, i) => {
        const a = ribbonPose(i), b = ringPose(i);
        const show = clamp(emerged - i);              // grows out of the lens
        let x = lerp(a.x, b.x, m), y = lerp(a.y, b.y, m), z = lerp(a.z, b.z, m);
        const rz = lerp(a.rz, b.rz, m), rx = lerp(a.rx, b.rx, m), ry = lerp(a.ry, b.ry, m);
        x = lerp(L.x, x, show); y = lerp(L.y, y, show);
        let sc = lerp(.3, 1, ease(show));
        if (i === hover) { sc *= 1.14; z += 70; }
        const dim = lerp(a.dim, b.dim, m) * (hover >= 0 && i !== hover ? .65 : 1);
        f.style.transform = `translate3d(${(x - fw / 2).toFixed(1)}px,${(y - fh / 2).toFixed(1)}px,${z.toFixed(1)}px) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        f.style.opacity = show < .02 ? 0 : 1;
        f.style.setProperty("--shade", (1 - dim).toFixed(2));
        f.style.zIndex = Math.round(1000 + z);
      });
      if (running) raf = requestAnimationFrame(frame);
    }
    function play() {
      if (played) return; played = true; mode = "play"; emerged = 0; setFlow(1);
      stage.classList.add("playing");
    }
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    measure(); addEventListener("resize", () => { measure(); if (!running) frame(performance.now()); });
    if (reduce) { emerged = N + 1; mode = "play"; played = true; setFlow(1); requestAnimationFrame(frame); }
    else {
      visible(stage, v => { if (v) { start(); if (!played) setTimeout(play, 700); } else stop(); }, "0px");
      requestAnimationFrame(frame);
    }
    $$("[data-reel-play]", sec).forEach(b => b.addEventListener("click", () => { play(); stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }));
    modeBtns.forEach(b => b.addEventListener("click", () => {
      auto = false; mTarget = b.dataset.reelMode === "ring" ? 1 : 0; play(); setFlow(mTarget ? 2 : 1);
      modeBtns.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      if (reduce) requestAnimationFrame(frame);
    }));
    frames.forEach((f, i) => {
      f.addEventListener("pointerenter", () => { hover = i; targetSpeed = .05; setFlow(2); });
      f.addEventListener("pointerleave", () => { hover = -1; targetSpeed = 1; });
      f.addEventListener("focus", () => { hover = i; targetSpeed = 0; });
      f.addEventListener("blur", () => { hover = -1; targetSpeed = 1; });
      f.addEventListener("click", () => { if (drag && drag.moved) return; openView(+f.dataset.photo || 0); });
    });
    // drag to spin / scrub
    stage.addEventListener("pointerdown", e => { drag = { x: e.clientX, phi, time, moved: false }; });
    addEventListener("pointermove", e => {
      if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true;
      phi = drag.phi + dx * .006; if (m < .5) time = drag.time - dx * .01; auto = false;
    });
    addEventListener("pointerup", () => { setTimeout(() => (drag = null), 0); });

    /* ---------- project view (lightbox) ---------- */
    const view = $("#pview"); if (!view) return;
    const photos = $$("[data-photo-src]", view).map(n => ({ src: n.dataset.photoSrc, alt: n.dataset.photoAlt, cap: n.dataset.photoCap }));
    const img = $(".pv-img", view), cap = $(".pv-cap", view), count = $(".pv-count", view), thumbs = $(".pv-thumbs", view);
    thumbs.innerHTML = photos.map((p, i) => `<button type="button" data-i="${i}" aria-label="Photo ${i + 1}"><img src="${esc(p.src)}" alt="" loading="lazy" width="96" height="72"></button>`).join("");
    let cur = 0, lastFocus = null;
    function show(i) {
      cur = (i + photos.length) % photos.length; const p = photos[cur];
      img.classList.remove("in"); void img.offsetWidth;
      img.src = p.src; img.alt = p.alt; cap.textContent = p.cap; count.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
      img.classList.add("in");
      $$("button", thumbs).forEach((b, k) => b.setAttribute("aria-current", String(k === cur)));
    }
    function openView(i) {
      lastFocus = document.activeElement; setFlow(3);
      view.hidden = false; requestAnimationFrame(() => view.classList.add("open"));
      document.documentElement.style.overflow = "hidden"; show(i); $(".pv-close", view).focus();
      if (window.slTrack) slTrack("project_view", { project: "BiggTime Entertainment" }, "ViewContent");
    }
    function closeView() {
      view.classList.remove("open"); document.documentElement.style.overflow = "";
      setTimeout(() => (view.hidden = true), 450); setFlow(m > .5 ? 2 : 1); if (lastFocus) lastFocus.focus();
    }
    $(".pv-close", view).addEventListener("click", closeView);
    $(".pv-prev", view).addEventListener("click", () => show(cur - 1));
    $(".pv-next", view).addEventListener("click", () => show(cur + 1));
    thumbs.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) show(+b.dataset.i); });
    view.addEventListener("click", e => { if (e.target === view) closeView(); });
    addEventListener("keydown", e => {
      if (view.hidden) return;
      if (e.key === "Escape") closeView();
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "Tab") { const f = $$("button", view).filter(b => b.offsetParent); const k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    let sx = null; view.addEventListener("touchstart", e => (sx = e.touches[0].clientX), { passive: true });
    view.addEventListener("touchend", e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
  })();

  /* =======================================================
     3. BRAND SCANNER
     ======================================================= */
  (function scanner() {
    const form = $("#scanForm"); if (!form) return;
    const sec = form.closest("section"), hud = $(".scan-hud", sec), log = $(".scan-log", sec), res = $(".scan-result", sec), urlLabel = $("[data-scan-url]", sec);
    const boxes = $$(".sv-box", sec);
    const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
    const say = async (txt, cls = "") => { const li = document.createElement("li"); li.className = cls; li.textContent = txt; log.appendChild(li); log.scrollTop = log.scrollHeight; await sleep(260); };

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const input = $("input", form), raw = input.value.trim();
      const err = $(".scan-err", form); err.textContent = "";
      if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(raw)) { err.textContent = "Enter a website address, like yourbrand.com"; input.focus(); return; }
      const btn = $("button", form); btn.disabled = true; btn.querySelector("span").textContent = "Scanning…";
      res.hidden = true; log.innerHTML = ""; hud.classList.remove("done"); hud.classList.add("scanning");
      boxes.forEach(b => b.classList.remove("ok", "bad", "hit"));
      if (urlLabel) urlLabel.textContent = raw.replace(/^https?:\/\//, "");
      const job = fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: raw }) })
        .then(r => r.json().then(j => ({ ok: r.ok, j }))).catch(() => ({ ok: false, j: { error: "The scanner couldn't connect. Please try again." } }));
      await say("› Initialising environment scan");
      await say("› Resolving host " + raw.replace(/^https?:\/\//, "").split("/")[0]);
      await say("› Fetching public homepage");
      for (const b of boxes) { b.classList.add("hit"); await sleep(170); }
      await say("› Reading identity signals: title, meta, social cards");
      await say("› Detecting pixels, tags and platform");
      await say("› Checking AI-search visibility");
      const { ok, j } = await job;
      hud.classList.remove("scanning");
      btn.disabled = false; btn.querySelector("span").textContent = "Scan again";
      if (!ok || j.error) { await say("× " + (j.error || "Scan failed."), "bad"); return; }
      await say(`✓ Brand identified: ${j.brand.name}`, "ok");
      const map = { identity: "title", search: "description", social: "og", ads: "pixel", ai: "ai", speed: "speed" };
      boxes.forEach(b => { const k = map[b.dataset.box]; const c = j.checks.find(x => x.id === k); if (c) b.classList.add(c.pass ? "ok" : "bad"); });
      hud.classList.add("done");
      render(j);
      if (window.slTrack) slTrack("brand_scan", { score: j.score });
    });

    function render(j) {
      const passed = j.checks.filter(c => c.pass).length, total = j.checks.length, pct = Math.round(passed / total * 100);
      const groups = {};
      j.checks.forEach(c => (groups[c.group] = groups[c.group] || []).push(c));
      res.innerHTML = `
        <div class="sr-id">
          ${j.brand.icon ? `<img class="sr-ico" src="${esc(j.brand.icon)}" alt="" width="40" height="40" loading="lazy">` : ""}
          <div><p class="sr-k">Brand identified</p><h3>${esc(j.brand.name)}</h3><p class="sr-u">${esc(j.finalUrl)}</p></div>
          ${j.brand.themeColor ? `<span class="sr-sw" style="background:${esc(j.brand.themeColor)}" title="Brand colour ${esc(j.brand.themeColor)}"></span>` : ""}
          <div class="sr-score" style="--p:${pct}"><b>${passed}/${total}</b><small>checks passed</small></div>
        </div>
        ${j.platform ? `<p class="sr-meta">Built with <b>${esc(j.platform)}</b> · Loaded in <b>${(j.timeMs / 1000).toFixed(1)} s</b>${j.social.length ? ` · Social profiles found: <b>${j.social.map(esc).join(", ")}</b>` : ""}</p>` : `<p class="sr-meta">Loaded in <b>${(j.timeMs / 1000).toFixed(1)} s</b>${j.social.length ? ` · Social profiles found: <b>${j.social.map(esc).join(", ")}</b>` : ""}</p>`}
        <div class="sr-groups">${Object.entries(groups).map(([g, cs]) => `<div class="sr-g"><h4>${esc(g)}</h4><ul>${cs.map(c => `<li class="${c.pass ? "ok" : "bad"}"><i aria-hidden="true">${c.pass ? "✓" : "!"}</i><span><b>${esc(c.label)}</b>${c.detail ? `<small>${esc(c.detail)}</small>` : ""}</span><span class="sr-only">${c.pass ? "passed" : "needs work"}</span></li>`).join("")}</ul></div>`).join("")}</div>
        <div class="sr-cta"><p>This is a quick automated check of one page. The free growth audit goes much deeper: ads, competitors, content and your first three moves.</p><a href="#audit" class="btn btn-gold" data-cta="scanner" data-prefill="${esc(j.finalUrl)}">Get the full audit for ${esc(j.brand.name)}</a></div>`;
      res.hidden = false;
      const ico = res.querySelector(".sr-ico"); if (ico) ico.addEventListener("error", () => ico.remove());
      res.querySelector("[data-prefill]").addEventListener("click", ev => { const w = $("#f-website"); if (w) w.value = ev.currentTarget.dataset.prefill; });
      res.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
  })();
})();
