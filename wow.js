/* Lola's Cafe wow layer — loyalty, confetti, fly-to-cart, cinematic entrance */
const LolaWow = (() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const GOAL = 10, STEP = 10000, FREE = "Chicken Shawarma";
  const stampCount = () => Math.floor(get("lola_spend", 0) / STEP);
  let earnedNow = 0, beforeNow = 0, toNext = 0, lastCount = 0, firstLoad = true, heroImg = null, hadOverlay = false;
  let spyIO = null, cartBar = null;
  const spyCats = new Set(), counted = new Set();

  /* ---------- splash ---------- */
  function splash() {
    if (RM || sessionStorage.getItem("lola_splash")) return;
    sessionStorage.setItem("lola_splash", "1");
    const el = document.createElement("div");
    el.className = "wow-splash";
    el.innerHTML = '<div class="ws-inner"><img src="img/logo-light.png" alt="Lola\'s Cafe"><div class="ws-tag">One caf&eacute;, every craving</div></div>';
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("done"), 1500);
    setTimeout(() => el.remove(), 2250);
  }

  /* ---------- confetti ---------- */
  function confetti(cx, cy) {
    if (RM) return;
    const cv = document.createElement("canvas");
    cv.className = "wow-confetti";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ["#5c0c0c", "#fdc89e", "#e8821e", "#c41212", "#fce7c1", "#ffffff"];
    const ps = Array.from({ length: 140 }, () => ({
      x: cx ?? innerWidth / 2, y: cy ?? innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 11 - 4,
      g: 0.3 + Math.random() * 0.15, s: 4 + Math.random() * 7,
      r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.35,
      c: colors[(Math.random() * colors.length) | 0], o: 1, sq: Math.random() < 0.5
    }));
    const t0 = performance.now();
    (function tick(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = false;
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr;
        if (t - t0 > 1300) p.o -= 0.03;
        if (p.o <= 0) continue;
        alive = true;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.o);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.sq) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        else { ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.72, p.s * 0.45, 0, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      if (alive) requestAnimationFrame(tick); else cv.remove();
    })(t0);
  }

  /* ---------- fly to cart ---------- */
  function flyToCart(img) {
    const cart = document.querySelector(".icon-btn");
    if (!img || !cart || RM) return;
    const r = img.getBoundingClientRect(), c = cart.getBoundingClientRect();
    const g = document.createElement("div");
    g.className = "fly-ghost";
    g.style.left = (r.left + r.width / 2 - 24) + "px";
    g.style.top = (r.top + r.height / 2 - 24) + "px";
    g.innerHTML = '<img src="' + img.src + '" alt="">';
    document.body.appendChild(g);
    requestAnimationFrame(() => {
      const dx = c.left + c.width / 2 - (r.left + r.width / 2);
      const dy = c.top + c.height / 2 - (r.top + r.height / 2);
      g.style.transform = "translate(" + dx + "px," + dy + "px) scale(.16) rotate(14deg)";
      g.style.opacity = ".35";
    });
    setTimeout(() => g.remove(), 700);
    cart.classList.remove("bump"); void cart.offsetWidth; cart.classList.add("bump");
  }

  /* ---------- loyalty ---------- */
  function onOrder(o) {
    const prevSpend = get("lola_spend", 0), spend = prevSpend + o.total;
    beforeNow = Math.floor(prevSpend / STEP);
    set("lola_spend", spend);
    earnedNow = Math.floor(spend / STEP) - beforeNow;
    toNext = earnedNow ? 0 : STEP - (spend % STEP);
  }
  function stampCard(fill, popFrom) {
    const slots = Array.from({ length: GOAL }, (_, i) => {
      const on = i < fill, pop = popFrom != null && i >= popFrom && i < fill;
      return '<i class="ws ' + (on ? "on" : "") + (pop ? " pop" : "") + '" style="--d:' + Math.max(0, i - (popFrom ?? fill)) * 130 + 'ms"></i>';
    }).join("");
    const freebies = Math.floor(fill / GOAL), prog = fill % GOAL;
    return '<div class="loyal">' +
      '<div class="loyal-h"><b>Lola&rsquo;s Loyalty</b><span>' + (freebies ? freebies + " free reward" + (freebies > 1 ? "s" : "") + " unlocked" : "Collect 10 stamps, get a free " + FREE) + "</span></div>" +
      '<div class="loyal-row">' + slots + "</div>" +
      '<div class="loyal-p"><i style="width:' + (prog / GOAL) * 100 + '%"></i></div>' +
      '<div class="loyal-f">' + prog + "/10 stamps &middot; every &#8358;10,000 spent = 1 stamp</div></div>";
  }
  function toast(msg, ms) {
    document.querySelectorAll(".wow-toast").forEach(t => t.remove());
    const t = document.createElement("div");
    t.className = "wow-toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 450); }, ms || 3600);
  }
  function injectConfirm() {
    const anchor = document.querySelector(".center .order-id");
    if (!anchor || anchor.parentElement.querySelector(".loyal")) return;
    const fill = beforeNow + earnedNow;
    anchor.insertAdjacentHTML("afterend", stampCard(fill, earnedNow ? beforeNow : null));
    if (!RM) setTimeout(() => {
      const st = document.querySelector(".center .loyal .ws.pop");
      if (!st) return;
      const r = st.getBoundingClientRect(), sp = document.createElement("i");
      sp.className = "stamp-spark"; sp.textContent = "\u2728";
      sp.style.left = (r.left + r.width / 2) + "px"; sp.style.top = r.top + "px";
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 950);
    }, 450);
    const tick = document.querySelector(".center .tick");
    if (tick) { const r = tick.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); }
    const prog = fill % GOAL;
    if (Math.floor(fill / GOAL) > Math.floor(beforeNow / GOAL)) {
      toast("Free " + FREE + " unlocked! Show your stamps at the counter", 5200);
      setTimeout(() => confetti(innerWidth / 2, innerHeight * 0.4), 750);
    } else {
      if (earnedNow) toast("+" + earnedNow + " stamp" + (earnedNow > 1 ? "s" : "") + " \u00b7 " + prog + " of 10 to a free " + FREE);
      else toast("\u20a6" + toNext.toLocaleString() + " more to your next stamp");
    }
  }
  function injectChip() {
    const tools = document.querySelector(".hdr .tools");
    if (!tools || tools.querySelector(".loyal-chip")) return;
    const chip = document.createElement("button");
    chip.className = "loyal-chip"; chip.type = "button";
    chip.innerHTML = '<span aria-hidden="true">&#127991;</span><b>' + (stampCount() % GOAL) + "</b>/" + GOAL;
    chip.addEventListener("click", openSheet);
    tools.insertBefore(chip, tools.firstChild);
  }
  function openSheet() {
    document.querySelectorAll(".loyal-sheet").forEach(s => s.remove());
    const s = document.createElement("div");
    s.className = "loyal-sheet";
    s.innerHTML = '<div class="ls-card"><div style="font-family:Fraunces,Georgia,serif;font-weight:700;font-size:17px;margin-bottom:12px">Your loyalty card</div>' + stampCard(stampCount()) + '<button class="btn" style="width:100%;margin-top:14px" id="ls-close">Done</button></div>';
    document.body.appendChild(s);
    s.addEventListener("click", e => { if (e.target === s || e.target.id === "ls-close") s.remove(); });
  }

  /* ---------- tracking wow ---------- */
  function decorateTrack() {
    const tl = document.querySelector(".timeline");
    if (!tl) return;
    let fill = tl.querySelector(".tl-fill"), chef = tl.querySelector(".tl-chef");
    if (!fill) {
      fill = document.createElement("i"); fill.className = "tl-fill"; tl.appendChild(fill);
      chef = document.createElement("span"); chef.className = "tl-chef"; chef.setAttribute("aria-hidden", "true"); tl.appendChild(chef);
    }
    const now = tl.querySelector(".tstep.now");
    if (now) {
      fill.style.top = "12px";
      const target = now.offsetTop + 12;
      if (fill.style.height && fill.style.height !== "0px" && fill._mounted) {
        fill.style.height = target + "px";
      } else {
        fill._mounted = true;
        fill.style.height = "12px";
        requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.height = target + "px"; }));
      }
      chef.style.top = (now.offsetTop + 1) + "px";
      chef.textContent = tl.textContent.includes("Out for delivery") ? "\uD83D\uDEF5" : "\uD83D\uDC69\u200D\uD83C\uDF73";
    }
  }

  /* ---------- hero wow ---------- */
  function decorateHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    if (!hero.querySelector(".float-emoji")) {
      ["\uD83C\uDF54", "\uD83C\uDF55", "\uD83C\uDF5F"].forEach((em, i) => {
        const s = document.createElement("span");
        s.className = "float-emoji e" + (i + 1); s.textContent = em; s.setAttribute("aria-hidden", "true");
        hero.appendChild(s);
      });
    }
    heroImg = hero.querySelector("img");
  }
  function parallax() {
    if (!heroImg || RM) return;
    const y = Math.min(Math.max(scrollY, 0), 600);
    heroImg.style.transform = "translateY(" + (y * 0.28) + "px) scale(" + (1 + y * 0.0006) + ")";
  }

  /* ---------- cards ---------- */
  function decorateCards() {
    document.querySelectorAll(".item-card").forEach(el => {
      if (FINE && !el._tilt) {
        el._tilt = true;
        el.addEventListener("pointermove", e => {
          if (RM) return;
          const r = el.getBoundingClientRect();
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
          el.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-3px)";
        });
        el.addEventListener("pointerleave", () => { el.style.transform = ""; });
      }
    });
    if (!firstLoad) {
      document.querySelectorAll(".item-card.rv:not(.in)").forEach(el => {
        if (el.getBoundingClientRect().top < innerHeight) {
          el.style.transition = "none";
          el.classList.add("in");
          requestAnimationFrame(() => { el.style.transition = ""; });
        }
      });
    }
  }

  /* ---------- ticker ---------- */
  function injectTicker() {
    const hero = document.querySelector(".hero");
    if (!hero || document.querySelector(".ticker")) return;
    const t = document.createElement("div");
    t.className = "ticker";
    const line = "ONE CAF&Eacute;, EVERY CRAVING &nbsp;&#9733;&nbsp; BURGERS &nbsp;&#9733;&nbsp; PIZZA &nbsp;&#9733;&nbsp; WINGS &nbsp;&#9733;&nbsp; SHAWARMA &nbsp;&#9733;&nbsp; FRIES &nbsp;&#9733;&nbsp; DRINKS &nbsp;&#9733;&nbsp; ";
    t.innerHTML = '<div class="tk">' + line + line + "</div>";
    hero.insertAdjacentElement("afterend", t);
  }

  /* ---------- after each render ---------- */
  function afterRender() {
    const ov = document.querySelector(".overlay");
    if (ov && !hadOverlay) { const sh = ov.querySelector(".sheet"); if (sh) { sh.classList.add("anim"); void sh.offsetWidth; } }
    hadOverlay = !!ov;
    decorateHero();
    decorateCards();
    injectChip();
    injectTicker();
    decorateTrack();
    if (document.querySelector(".center .tick") && document.querySelector(".center .order-id")) injectConfirm();
    const n = document.querySelector(".icon-btn .n");
    if (n) {
      const c = +n.textContent;
      if (c !== lastCount) { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; lastCount = c; }
    }
    parallax();
    priceWatch();
    spyInit();
  }
  const app = document.getElementById("app");
  if (app) new MutationObserver(() => requestAnimationFrame(afterRender)).observe(app, { childList: true, subtree: false });

  /* ---------- round 2: ripple, scroll-spy, cart bar, count-up ---------- */
  function addRipple(e) {
    if (RM) return;
    const el = e.target.closest(".btn,.pill,.add");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2.1;
    const s = document.createElement("span");
    s.className = "rp";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left - d / 2) + "px";
    s.style.top = (e.clientY - r.top - d / 2) + "px";
    el.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }
  function countUp(el) {
    const v = parseInt((el.textContent || "").replace(/\D/g, ""), 10);
    if (!v || RM) return;
    const t0 = performance.now(), dur = 620;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = "\u20a6" + Math.round(v * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function priceWatch() {
    document.querySelectorAll(".item-card.in").forEach(card => {
      const id = card.dataset.item;
      if (!id || counted.has(id)) return;
      counted.add(id);
      const p = card.querySelector(".price");
      if (p) countUp(p);
    });
  }
  function spyInit() {
    if (RM) return;
    if (spyIO) { document.querySelectorAll(".cat").forEach(c => spyIO.observe(c)); return; }
    spyIO = new IntersectionObserver((ents) => {
      ents.forEach(en => { if (en.isIntersecting) spyCats.add(en.target); else spyCats.delete(en.target); });
      const arr = [...spyCats];
      const name = arr.length ? arr[arr.length - 1].textContent.trim() : null;
      document.querySelectorAll(".pill").forEach(p => {
        p.classList.toggle("spy", !!name && p.textContent.trim() === name && !p.classList.contains("on"));
      });
    }, { rootMargin: "-38% 0px -55% 0px" });
    document.querySelectorAll(".cat").forEach(c => spyIO.observe(c));
  }
  function onCart(count, total) {
    if (!cartBar) {
      cartBar = document.createElement("div");
      cartBar.className = "cart-bar";
      cartBar.setAttribute("role", "button");
      cartBar.setAttribute("aria-label", "Open cart");
      cartBar.innerHTML = '<span class="cb-n"></span><span class="cb-go">View cart</span>';
      cartBar.addEventListener("click", () => { const b = document.querySelector("[data-open-cart]"); if (b) b.click(); });
      document.body.appendChild(cartBar);
    }
    const home = !location.hash || location.hash === "#/" || location.hash === "#home" || location.hash === "#";
    const show = count > 0 && home && !document.querySelector(".overlay") && !document.querySelector(".center .tick");
    cartBar.classList.toggle("show", show);
    if (show) cartBar.querySelector(".cb-n").innerHTML = "<b>" + count + "</b>&nbsp;item" + (count > 1 ? "s" : "") + " &middot; &#8358;" + total.toLocaleString("en-US");
  }
  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add],[data-addmodal]");
    if (!add) return;
    let img = null;
    const card = add.closest(".item-card");
    if (card) img = card.querySelector("img");
    else { const ov = add.closest(".overlay"); if (ov) img = ov.querySelector("img"); }
    flyToCart(img);
    if (card) { card.classList.add("added"); setTimeout(() => card.classList.remove("added"), 900); }
  }, true);
  document.addEventListener("pointerdown", addRipple, { passive: true });
  addEventListener("scroll", () => { parallax(); priceWatch(); }, { passive: true });
  addEventListener("resize", () => decorateTrack());
  addEventListener("DOMContentLoaded", () => {
    splash();
    afterRender();
    setTimeout(() => { document.body.classList.add("settled"); firstLoad = false; }, 2700);
  });
  if (document.readyState !== "loading") { splash(); afterRender(); setTimeout(() => { document.body.classList.add("settled"); firstLoad = false; }, 2700); }

  return { onOrder, confetti, toast, stampCard, onCart };
})();
