/* Lola's Cafe demo — vanilla JS, no build step */
const $ = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const fmt = (n) => "\u20A6" + n.toLocaleString("en-NG");
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const STATUSES = [
  { id: "placed", label: "Order placed" },
  { id: "confirmed", label: "Confirmed" },
  { id: "kitchen", label: "In the kitchen" },
  { id: "ready", label: "Being served" },
  { id: "completed", label: "Completed" }
];
const NEXT = { placed: "confirmed", confirmed: "kitchen", kitchen: "ready", ready: "completed" };

const state = {
  cart: store.get("lola_cart", []),
  orders: store.get("lola_orders", []),
  sim: store.get("lola_sim", true),
  view: "home",
  activeCat: null,
  item: null,
  checkout: { type: "pickup" },
  payFor: null,
  lastOrder: null
};

let seq = store.get("lola_seq", 1042);
const nextId = () => { seq++; store.set("lola_seq", seq); return "LC-" + seq; };
const cartCount = () => state.cart.reduce((a, c) => a + c.qty, 0);
const cartTotal = () => state.cart.reduce((a, c) => a + c.price * c.qty, 0);

function addToCart(item, opts) {
  const key = item.id + "|" + (opts.mods.map(m => m.id).join(",") + "|" + (opts.size ? opts.size.id : ""));
  const found = state.cart.find(c => c.key === key);
  if (found) found.qty++;
  else state.cart.push({ key, id: item.id, name: item.name, price: item.price + opts.mods.reduce((a, m) => a + m.price, 0) + (opts.size ? opts.size.delta : 0), qty: 1, mods: opts.mods.map(m => m.name), size: opts.size ? opts.size.name : null });
  store.set("lola_cart", state.cart);
  render();
}
function setQty(key, d) {
  const c = state.cart.find(x => x.key === key);
  if (!c) return;
  c.qty += d;
  if (c.qty <= 0) state.cart = state.cart.filter(x => x.key !== key);
  store.set("lola_cart", state.cart);
  render();
}
function placeOrder(form) {
  const o = {
    id: nextId(), ts: Date.now(),
    items: state.cart.map(c => ({ name: c.name + (c.size ? " (" + c.size + ")" : ""), mods: c.mods, qty: c.qty, price: c.price })),
    total: form.total, type: form.type, fee: form.fee,
    name: form.name, phone: form.phone, address: form.address || "", note: form.note || "",
    pay: form.pay, paid: form.pay === "online", status: "placed", events: [{ s: "placed", t: Date.now() }]
  };
  state.orders.unshift(o); store.set("lola_orders", state.orders);
  state.cart = []; store.set("lola_cart", state.cart);
  state.lastOrder = o.id;
  return o;
}
function setStatus(o, s) {
  o.status = s; o.events.push({ s, t: Date.now() });
  store.set("lola_orders", state.orders);
}
/* demo auto-advance */
setInterval(() => {
  if (!state.sim) return;
  const t = Date.now(); let changed = false;
  for (const o of state.orders) {
    if (o.status === "completed") continue;
    const age = (t - o.ts) / 1000;
    const step = { placed: 6, confirmed: 18, kitchen: 34, ready: 80 }[o.status] || 1e9;
    if (age > step) { setStatus(o, NEXT[o.status]); changed = true; }
  }
  if (changed && (state.view === "admin" || state.view === "track")) render();
}, 2000);

/* ---------- rendering ---------- */
function header() {
  const n = cartCount();
  return `
  <div class="hdr">
    <div class="brand"><b>Lola's Cafe</b><span>Abraka</span></div>
    <div class="tools">
      <span class="chip">DEMO</span>
      <button class="icon-btn" data-go="track">&#128241;</button>
      <button class="icon-btn" data-open-cart>&#128722;${n ? `<i class="n">${n}</i>` : ""}</button>
    </div>
  </div>`;
}
function hero() {
  return `
  <div class="hero">
    <img src="img/burger.jpg" alt="Signature burger and golden fries">
    <div class="veil"></div>
    <div class="inner">
      <h1>Order ahead.<br>Skip the wait.</h1>
      <p>Burgers, pizza, wings and signature drinks, made fresh at ${DEMO.address.split(",")[0]}.</p>
      <div class="meta">
        <span class="chip">${DEMO.hours}</span>
        <span class="chip">Pickup &amp; delivery</span>
      </div>
    </div>
  </div>`;
}
function menu() {
  const cats = MENU.filter(c => !state.activeCat || c.id === state.activeCat);
  return `
  <div class="pills">
    <button class="pill ${!state.activeCat ? "on" : ""}" data-cat="">All</button>
    ${MENU.map(c => `<button class="pill ${state.activeCat === c.id ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`).join("")}
  </div>
  <div class="wrap">
    ${cats.map(c => `
      <div class="cat serif">${c.name}</div>
      ${c.items.map(it => `
        <div class="item-card" data-item="${it.id}">
          <img src="${it.img}" alt="${it.name}" loading="lazy">
          <div class="info">
            <h3>${it.name}</h3>
            <div class="desc">${it.desc}</div>
            <div class="row"><span class="price">${fmt(it.price)}</span><button class="add" data-add="${it.id}">+</button></div>
          </div>
        </div>`).join("")}
    `).join("")}
  </div>`;
}
function footer() {
  return `
  <div class="ftr">
    <b>Lola's Cafe</b> &middot; ${DEMO.address}<br>
    ${DEMO.hours} &middot; ${DEMO.phone} / ${DEMO.phone2}
    <div class="demo-note">Demo build. Menu items and prices are samples, payment is simulated. The real build plugs in Lola's actual menu.</div>
    Demo built by John Enechukwu<br>
    <a class="admin-link" href="#admin">demo kitchen panel</a>
  </div>`;
}
function home() { return header() + hero() + menu() + footer(); }

function itemModal() {
  const cat = MENU.flatMap(c => c.items.map(i => ({ c, i }))).find(x => x.i.id === state.item);
  if (!cat) return "";
  const it = cat.i;
  return `
  <div class="overlay" data-close>
    <div class="sheet" data-sheet>
      <div class="grab"></div>
      <img src="${it.img}" alt="${it.name}" style="width:100%;height:190px;object-fit:cover;border-radius:16px">
      <h2 class="serif" style="font-size:21px;margin:14px 0 4px">${it.name}</h2>
      <p style="font-size:13px;color:var(--ink2)">${it.desc}</p>
      ${it.sizes ? `
      <div class="field" style="margin-top:16px"><label>Size</label>
        <div class="seg" data-seg="size">${it.sizes.map((s, i) => `<button class="${i === 0 ? "on" : ""}" data-sid="${s.id}">${s.name}${s.delta ? " +" + fmt(s.delta) : ""}</button>`).join("")}</div>
      </div>` : ""}
      ${it.mods && it.mods.length ? `
      <div class="field" style="margin-top:12px"><label>Extras</label>
        ${it.mods.map(m => `<label style="display:flex;align-items:center;gap:10px;text-transform:none;letter-spacing:0;font-size:13.5px;font-weight:500;color:var(--ink);padding:10px 0;border-bottom:1px solid var(--line)">
          <input type="checkbox" data-mod="${m.id}" style="width:18px;height:18px;accent-color:var(--amber)"> ${m.name} <span style="margin-left:auto;font-weight:700">+${fmt(m.price)}</span></label>`).join("")}
      </div>` : ""}
      <div class="btn-row"><button class="btn amber" data-addmodal="${it.id}">Add to order &middot; <span data-liveprice>${fmt(it.price)}</span></button></div>
    </div>
  </div>`;
}
function cartSheet() {
  if (!state.cart.length) return `
  <div class="overlay" data-close><div class="sheet" data-sheet><div class="grab"></div>
    <div class="center" style="padding:20px">
      <p style="font-weight:700;font-size:16px" class="serif">Your order is empty</p>
      <p style="font-size:13px;color:var(--ink2);margin-top:4px">Add something delicious from the menu.</p>
    </div>
  </div></div>`;
  return `
  <div class="overlay" data-close><div class="sheet" data-sheet>
    <div class="grab"></div>
    <h2 class="serif" style="font-size:19px;margin-bottom:8px">Your order</h2>
    ${state.cart.map(c => `
      <div class="cline">
        <div class="t"><b>${c.name}${c.size ? " (" + c.size + ")" : ""}</b>${c.mods.length ? `<span>${c.mods.join(" &middot; ")}</span>` : ""}<span style="display:block;font-weight:700;color:var(--ink);margin-top:2px">${fmt(c.price)}</span></div>
        <div class="stepper"><button data-q="-1" data-key="${c.key}">&minus;</button>${c.qty}<button data-q="1" data-key="${c.key}">+</button></div>
      </div>`).join("")}
    <div style="margin-top:12px">
      <div class="totrow big"><span>Total</span><span>${fmt(cartTotal())}</span></div>
    </div>
    <div class="btn-row"><button class="btn" data-go="checkout">Checkout</button></div>
  </div></div>`;
}

function checkout() {
  const c = state.checkout;
  const sub = cartTotal(), fee = c.type === "delivery" ? DEMO.deliveryFee : 0;
  return `
  ${header()}
  <a class="back" data-go="home">&larr; Back to menu</a>
  <div class="wrap" style="padding-top:2px">
    <h2 class="serif" style="font-size:22px;margin-bottom:14px">Checkout</h2>
    <div class="field"><label>Your name</label><input id="f-name" placeholder="e.g. Chidera"></div>
    <div class="field"><label>Phone number</label><input id="f-phone" inputmode="tel" placeholder="08xx xxx xxxx"></div>
    <div class="field"><label>How are you getting it?</label>
      <div class="seg"><button class="${c.type === "pickup" ? "on" : ""}" data-type="pickup">Pickup at the cafe</button><button class="${c.type === "delivery" ? "on" : ""}" data-type="delivery">Delivery</button></div>
    </div>
    ${c.type === "delivery" ? `<div class="field"><label>Delivery address</label><textarea id="f-addr" rows="2" placeholder="Hostel, street, landmark"></textarea></div>` : ""}
    <div class="field"><label>Note for the kitchen (optional)</label><input id="f-note" placeholder="Extra sauce, no onions..."></div>
    <div class="field"><label>Payment</label>
      <div class="seg"><button class="${c.pay !== "pickup" ? "on" : ""}" data-pay="online">Pay online now</button><button class="${c.pay === "pickup" ? "on" : ""}" data-pay="pickup">Pay at pickup</button></div>
    </div>
    <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:4px">
      ${state.cart.map(x => `<div class="totrow"><span>${x.qty} &times; ${x.name}${x.size ? " (" + x.size + ")" : ""}</span><span>${fmt(x.price * x.qty)}</span></div>`).join("")}
      <div class="totrow"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      ${fee ? `<div class="totrow"><span>Delivery</span><span>${fmt(fee)}</span></div>` : ""}
      <div class="totrow big"><span>Total</span><span>${fmt(sub + fee)}</span></div>
    </div>
    <div class="btn-row"><button class="btn amber" data-submit="${sub + fee}">${c.pay !== "pickup" ? "Pay " + fmt(sub + fee) : "Place order"}</button></div>
  </div>
  ${footer()}`;
}

function paymentModal(orderDraft) {
  const t = orderDraft.total;
  return `
  <div class="overlay" data-close><div class="sheet" data-sheet>
    <div class="grab"></div>
    <div style="text-align:center;margin:6px 0 4px">
      <div class="chip" style="display:inline-block">SECURE CARD PAYMENT &middot; DEMO</div>
      <div class="order-id" style="margin-top:10px">${fmt(t)}</div>
      <p style="font-size:11.5px;color:var(--ink2)">No real charge. The live build runs on Paystack.</p>
    </div>
    <div class="field" style="margin-top:14px"><label>Card number</label><input value="4084 0840 8408 4081" disabled></div>
    <div class="btn-row">
      <div class="field" style="flex:1"><label>Expiry</label><input value="09/30" disabled></div>
      <div class="field" style="flex:1"><label>CVV</label><input value="408" disabled></div>
    </div>
    <button class="btn amber" data-paynow>Pay ${fmt(t)}</button>
  </div></div>`;
}

function confirmView(o) {
  const labels = Object.fromEntries(STATUSES.map(s => [s.id, s.label]));
  return `
  ${header()}
  <div class="center">
    <div class="tick">&#10003;</div>
    <h2 class="serif" style="font-size:24px">Order confirmed!</h2>
    <p style="font-size:13px;color:var(--ink2);margin-top:6px">Show this code at the cafe or follow it live:</p>
    <div class="order-id" style="margin:12px 0 4px">${o.id}</div>
    <p style="font-size:12.5px;color:var(--ink2)">${o.pay === "online" ? "Paid online" : "Pay at pickup"} &middot; ${o.type === "delivery" ? "Out for delivery when ready" : "Pickup at the cafe"}</p>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn" data-track="${o.id}">Track my order</button>
    </div>
    <button class="btn ghost" style="margin-top:10px" data-go="home">Order something else</button>
  </div>
  ${footer()}`;
}

function trackView(id) {
  const o = state.orders.find(x => x.id === id);
  if (!o) return `${header()}<div class="center"><h2 class="serif" style="font-size:22px">Track an order</h2>
    <p style="font-size:13px;color:var(--ink2);margin:8px 0 16px">Enter your order code:</p>
    <div style="display:flex;gap:8px;max-width:300px;margin:0 auto">
      <input id="t-id" placeholder="LC-1042" style="flex:1;border:1.5px solid var(--line);border-radius:13px;padding:12px;text-transform:uppercase">
      <button class="btn" style="width:auto;padding:0 18px" data-tracklookup>Go</button>
    </div>
    ${state.orders.length ? `<p style="font-size:12px;color:var(--ink2);margin-top:18px">Your recent orders: ${state.orders.slice(0, 3).map(x => `<a href="#track/${x.id}" style="font-weight:700;color:var(--ink)">${x.id}</a>`).join(" &middot; ")}</p>` : ""}
  </div>${footer()}`;
  const idx = STATUSES.findIndex(s => s.id === o.status);
  return `
  ${header()}
  <a class="back" data-go="home">&larr; Menu</a>
  <div class="wrap" style="padding-top:0">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin:6px 0 2px">
      <h2 class="serif" style="font-size:22px">${o.id}</h2>
      <span class="badge b-${o.status}">${labels[o.status]}</span>
    </div>
    <p style="font-size:12px;color:var(--ink2)">${o.type === "delivery" ? "Delivery to " + (o.address || "your address") : "Pickup at the cafe"} &middot; ${fmt(o.total)} ${o.paid ? "&middot; paid online" : "&middot; pay at pickup"}</p>
    <div class="timeline">
      ${STATUSES.map((s, i) => `
        <div class="tstep ${i < idx ? "done" : ""} ${i === idx ? "now" : ""} ${i > idx ? "pending" : ""}">
          <div class="dot">${i < idx ? "&#10003;" : ""}</div>
          <div><b>${s.label}</b>${i === idx && s.id !== "completed" ? `<span>Currently here &middot; live</span>` : i < idx && o.events.find(e => e.s === s.id) ? `<span>${new Date(o.events.find(e => e.s === s.id).t).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}</span>` : ""}</div>
        </div>`).join("")}
    </div>
    <div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px">
      ${o.items.map(x => `<div class="totrow"><span>${x.qty} &times; ${x.name}${x.mods && x.mods.length ? " <span style='color:var(--ink2)'>(" + x.mods.join(", ") + ")</span>" : ""}</span><span>${fmt(x.price * x.qty)}</span></div>`).join("")}
      <div class="totrow big"><span>Total</span><span>${fmt(o.total)}</span></div>
    </div>
  </div>
  <button class="sim-toggle" data-simtoggle>${state.sim ? "Demo: simulation ON" : "Demo: simulation OFF"}</button>
  ${footer()}`;
}

function adminView() {
  const today = state.orders.filter(o => new Date(o.ts).toDateString() === new Date().toDateString());
  const rev = today.reduce((a, o) => a + o.total, 0);
  const labels = Object.fromEntries(STATUSES.map(s => [s.id, s.label]));
  return `
  ${header()}
  <a class="back" data-go="home">&larr; Menu</a>
  <div class="wrap" style="padding-top:0">
    <h2 class="serif" style="font-size:22px;margin:4px 0 0">Kitchen panel</h2>
    <p style="font-size:12px;color:var(--ink2)">What Lola's team would see live. Tap a card to move the order along.</p>
    <div class="stat-row">
      <div class="stat"><b>${today.length}</b><span>Orders today</span></div>
      <div class="stat"><b>${fmt(rev)}</b><span>Revenue</span></div>
    </div>
    ${state.orders.length ? state.orders.map(o => `
      <div class="ocard" data-advance="${o.id}" style="cursor:pointer">
        <div class="top"><b class="serif" style="font-size:16px">${o.id}</b><span class="badge b-${o.status}">${labels[o.status]}</span></div>
        <div class="items">${o.items.map(x => x.qty + "&times; " + x.name).join(" &middot; ")} &middot; ${o.name || "Guest"} &middot; ${o.type}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:800;font-size:14px">${fmt(o.total)}</span>
          ${o.status !== "completed" ? `<span style="font-size:11px;font-weight:700;color:var(--amber)">Advance &rarr;</span>` : `<span style="font-size:11px;color:var(--ink2)">Done</span>`}
        </div>
      </div>`).join("") : `<div class="ocard" style="text-align:center;color:var(--ink2);font-size:13px">No orders yet. Place one from the menu and watch it land here live.</div>`}
  </div>
  <button class="sim-toggle" data-simtoggle>${state.sim ? "Demo: simulation ON" : "Demo: simulation OFF"}</button>
  ${footer()}`;
}

function render() {
  const app = document.getElementById("app");
  const scroll = window.scrollY;
  let html = "";
  if (state.view === "home") html = home();
  else if (state.view === "checkout") html = checkout();
  else if (state.view === "confirm") html = confirmView(state.orders.find(o => o.id === state.lastOrder) || { id: "", items: [], total: 0, pay: "", type: "pickup" });
  else if (state.view === "track") html = trackView(state.trackId);
  else if (state.view === "admin") html = adminView();
  if (state.item) html += itemModal();
  if (state.cartOpen) html += cartSheet();
  if (state.payFor) html += paymentModal(state.payFor);
  app.innerHTML = html;
  window.scrollTo(0, state.view === "home" ? scroll : 0);
  state.cartOpen = state.cartOpen; /* keep */
}

/* ---------- events ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-open-cart],[data-cat],[data-item],[data-add],[data-addmodal],[data-close],[data-q],[data-key],[data-type],[data-pay],[data-submit],[data-paynow],[data-track],[data-tracklookup],[data-advance],[data-simtoggle],[data-sid],a[href^='#track']");
  if (!t) return;
  if (t.matches("a[href^='#track']")) {
    e.preventDefault();
    state.view = "track"; state.trackId = t.getAttribute("href").split("/")[1]; render(); return;
  }
  if (t.dataset.close !== undefined) {
    if (e.target.closest("[data-sheet]")) return;
    state.item = null; state.cartOpen = false; state.payFor = null; render(); return;
  }
  if (t.dataset.go) { state.view = t.dataset.go; state.item = null; state.cartOpen = false; render(); return; }
  if (t.dataset.openCart !== undefined) { state.cartOpen = true; render(); return; }
  if (t.dataset.cat !== undefined) { state.activeCat = t.dataset.cat || null; render(); return; }
  if (t.dataset.item) { const it = MENU.flatMap(c => c.items).find(x => x.id === t.dataset.item); state.item = it.id; render(); return; }
  if (t.dataset.add) { const it = MENU.flatMap(c => c.items).find(x => x.id === t.dataset.add); addToCart(it, { mods: [], size: it.sizes ? it.sizes[0] : null }); state.cartOpen = true; return; }
  if (t.dataset.addmodal) {
    const it = MENU.flatMap(c => c.items).find(x => x.id === t.dataset.addmodal);
    const mods = [...document.querySelectorAll("[data-mod]:checked")].map(cb => it.mods.find(m => m.id === cb.dataset.mod));
    const sidEl = document.querySelector("[data-sid].on");
    const size = it.sizes ? it.sizes.find(s => s.id === sidEl.dataset.sid) : null;
    addToCart(it, { mods, size });
    state.item = null; state.cartOpen = true; render(); return;
  }
  if (t.dataset.sid) { document.querySelectorAll("[data-sid]").forEach(b => b.classList.remove("on")); t.classList.add("on"); updateLivePrice(); return; }
  if (t.dataset.q) { setQty(t.dataset.key, parseInt(t.dataset.q)); return; }
  if (t.dataset.type) { state.checkout.type = t.dataset.type; if (t.dataset.type === "pickup") state.checkout.pay = state.checkout.pay || "online"; render(); return; }
  if (t.dataset.pay) { state.checkout.pay = t.dataset.pay; render(); return; }
  if (t.dataset.submit) {
    const name = document.getElementById("f-name").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    if (!name || !phone) { alert("Add your name and phone number so the cafe can reach you."); return; }
    const addr = document.getElementById("f-addr") ? document.getElementById("f-addr").value.trim() : "";
    if (state.checkout.type === "delivery" && !addr) { alert("Add a delivery address."); return; }
    const note = document.getElementById("f-note").value.trim();
    const draft = { total: parseInt(t.dataset.submit), type: state.checkout.type, fee: state.checkout.type === "delivery" ? DEMO.deliveryFee : 0, name, phone, address: addr, note, pay: state.checkout.pay || "online" };
    if (draft.pay === "online") { state.payFor = draft; render(); return; }
    const o = placeOrder(draft); state.view = "confirm"; render(); return;
  }
  if (t.dataset.paynow !== undefined) {
    const o = placeOrder(state.payFor); state.payFor = null; state.view = "confirm"; render(); return;
  }
  if (t.dataset.track) { state.view = "track"; state.trackId = t.dataset.track; render(); return; }
  if (t.dataset.tracklookup !== undefined) { state.trackId = (document.getElementById("t-id").value || "").toUpperCase().trim(); state.trackId = state.orders.find(o => o.id === state.trackId) ? state.trackId : null; render(); return; }
  if (t.dataset.advance) {
    const o = state.orders.find(x => x.id === t.dataset.advance);
    if (o && o.status !== "completed") { setStatus(o, NEXT[o.status]); render(); }
    return;
  }
  if (t.dataset.simtoggle !== undefined) { state.sim = !state.sim; store.set("lola_sim", state.sim); render(); return; }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { state.item = null; state.cartOpen = false; state.payFor = null; render(); } });
function updateLivePrice() {
  const it = MENU.flatMap(c => c.items).find(x => x.id === state.item);
  if (!it) return;
  const mods = [...document.querySelectorAll("[data-mod]:checked")].map(cb => it.mods.find(m => m.id === cb.dataset.mod));
  const sidEl = document.querySelector("[data-sid].on");
  const size = it.sizes ? it.sizes.find(s => s.id === sidEl.dataset.sid) : null;
  const el = document.querySelector("[data-liveprice]");
  if (el) el.textContent = fmt(it.price + mods.reduce((a, m) => a + m.price, 0) + (size ? size.delta : 0));
}
function route() {
  const h = location.hash;
  if (h.startsWith("#admin")) { state.view = "admin"; }
  else if (h.startsWith("#track/")) { state.view = "track"; state.trackId = h.split("/")[1]; }
  else if (h === "#track") { state.view = "track"; }
  else state.view = "home";
  render();
}
window.addEventListener("hashchange", route);
route();
