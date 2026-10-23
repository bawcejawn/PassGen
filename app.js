(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var WORDS = window.PASSGEN_WORDS;
  var MODES = ["random", "memorable", "pin"];

  // Settings (not passwords) are remembered per browser for convenience.
  var DEFAULTS = {
    mode: "random",
    rLen: 20, rUpper: true, rNum: true, rSym: true, rAmb: false,
    mWords: 5, sep: "-", mCap: false, mNum: false,
    pLen: 6, theme: null
  };
  var state = Object.assign({}, DEFAULTS);
  try { Object.assign(state, JSON.parse(localStorage.getItem("passgen:settings") || "{}")); } catch (e) {}
  function save() { try { localStorage.setItem("passgen:settings", JSON.stringify(state)); } catch (e) {} }

  var current = "", history = [], reveal = false;

  // ---------- Theme ----------
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  $("themeBtn").addEventListener("click", function () {
    var dark = state.theme ? state.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    state.theme = dark ? "light" : "dark";
    applyTheme(); save();
  });

  // ---------- Generate ----------
  function generate(animate) {
    var r;
    if (state.mode === "random") r = PassGen.randomPassword({ length: state.rLen, upper: state.rUpper, numbers: state.rNum, symbols: state.rSym, avoidAmbiguous: state.rAmb });
    else if (state.mode === "memorable") r = PassGen.memorablePassword({ words: state.mWords, separator: state.sep, capitalize: state.mCap, addNumber: state.mNum }, WORDS);
    else r = PassGen.pin({ length: state.pLen });
    current = r.value;
    render(r.bits, animate);
  }

  function render(bits, animate) {
    var el = $("pw");
    el.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < current.length; i++) {
      var c = current[i];
      if (/[0-9]/.test(c) && state.mode !== "pin") { var s = document.createElement("span"); s.className = "n"; s.textContent = c; frag.appendChild(s); }
      else if (/[^A-Za-z0-9 ]/.test(c)) { var t = document.createElement("span"); t.className = "s"; t.textContent = c; frag.appendChild(t); }
      else frag.appendChild(document.createTextNode(c));
    }
    el.appendChild(frag);
    if (animate) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }

    var rt = PassGen.rate(bits);
    var colors = ["var(--weak)", "var(--fair)", "var(--good)", "var(--great)"];
    var bars = document.querySelectorAll(".bars i");
    for (var b = 0; b < bars.length; b++) bars[b].style.background = b < rt.level ? colors[rt.level - 1] : "";
    $("strength").innerHTML = "<b>" + rt.label + "</b> · " + Math.round(bits) + " bits · " + (rt.crack === "forever" ? "practically uncrackable" : rt.crack === "instantly" ? "cracked instantly" : "~" + rt.crack + " to crack");
    $("strength").title = "Estimated time for an offline attacker making 10 billion guesses per second";
  }

  // ---------- Copy ----------
  var toastTimer;
  function toast(msg) {
    $("toastText").textContent = msg;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("toast").classList.remove("show"); }, 1600);
  }
  function copyText(text) {
    var done = function () { toast("Copied to clipboard"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) && done(); });
    } else if (fallbackCopy(text)) done();
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    if (!ok) toast("Select the password and copy manually");
    return ok;
  }
  function copyCurrent() {
    copyText(current);
    if (history[0] !== current) {
      history.unshift(current);
      history = history.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 8);
      renderHistory();
    }
  }
  $("copyBtn").addEventListener("click", copyCurrent);
  $("pw").addEventListener("click", function () { if (!getSelection().toString() || getSelection().toString() === current) copyCurrent(); });

  var regen = $("regenBtn");
  regen.addEventListener("click", function () {
    regen.classList.remove("spin"); void regen.offsetWidth; regen.classList.add("spin");
    generate(true);
  });

  // ---------- History (memory only) ----------
  function mask(v) { return v.length <= 4 ? "••••" : v.slice(0, 2) + "•".repeat(Math.min(v.length - 4, 18)) + v.slice(-2); }
  function renderHistory() {
    var ul = $("hist"); ul.innerHTML = "";
    if (!history.length) { ul.innerHTML = '<li class="empty">Passwords you copy appear here until you close this tab.</li>'; return; }
    history.forEach(function (v) {
      var li = document.createElement("li");
      var code = document.createElement("code"); code.textContent = reveal ? v : mask(v);
      var btn = document.createElement("button"); btn.className = "mini"; btn.textContent = "Copy";
      btn.addEventListener("click", function () { copyText(v); });
      li.appendChild(code); li.appendChild(btn); ul.appendChild(li);
    });
  }
  $("revealBtn").addEventListener("click", function () { reveal = !reveal; this.textContent = reveal ? "Hide" : "Show"; renderHistory(); });
  $("clearBtn").addEventListener("click", function () { history = []; renderHistory(); });

  // ---------- Tabs ----------
  var tabs = document.querySelectorAll(".tabs button");
  function setMode(mode, gen) {
    state.mode = mode;
    var idx = MODES.indexOf(mode);
    $("pill").style.transform = "translateX(" + (idx * 100) + "%)";
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.mode === mode)); t.tabIndex = t.dataset.mode === mode ? 0 : -1; });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("on", p.dataset.panel === mode); });
    save();
    if (gen) generate(true);
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { setMode(t.dataset.mode, true); });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var i = (MODES.indexOf(state.mode) + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      setMode(MODES[i], true); tabs[i].focus();
    });
  });

  // ---------- Sliders + steppers ----------
  function setRange(id, val, gen) {
    var r = $(id), min = +r.min, max = +r.max;
    val = Math.max(min, Math.min(max, Math.round(+val || min)));
    r.value = val; $(id + "Num").value = val;
    r.style.setProperty("--p", ((val - min) / (max - min) * 100) + "%");
    state[id] = val; save();
    if (gen) generate(false);
  }
  ["rLen", "mWords", "pLen"].forEach(function (id) {
    $(id).addEventListener("input", function () { setRange(id, this.value, true); });
    var num = $(id + "Num");
    num.addEventListener("change", function () { setRange(id, this.value, true); });
    num.addEventListener("keydown", function (e) { if (e.key === "Enter") this.blur(); });
  });
  document.querySelectorAll("[data-step]").forEach(function (b) {
    var hold, rep;
    function step() { var id = b.dataset.for; setRange(id, +$(id).value + (+b.dataset.step), true); }
    function stop() { clearTimeout(hold); clearInterval(rep); }
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); step(); hold = setTimeout(function () { rep = setInterval(step, 60); }, 400); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, stop); });
    b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); } });
  });

  // ---------- Toggles ----------
  ["rUpper", "rNum", "rSym", "rAmb", "mCap", "mNum"].forEach(function (id) {
    $(id).addEventListener("change", function () { state[id] = this.checked; save(); generate(true); });
  });
  document.querySelectorAll("#sepChips button").forEach(function (b) {
    b.addEventListener("click", function () { state.sep = b.dataset.sep; syncChips(); save(); generate(true); });
  });
  function syncChips() { document.querySelectorAll("#sepChips button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.sep === state.sep)); }); }

  // ---------- Keyboard shortcuts ----------
  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (e.metaKey || e.ctrlKey || e.altKey || tag === "input" || tag === "textarea") return;
    if (e.key === " " && tag !== "button") { e.preventDefault(); regen.click(); }
    else if (e.key === "Enter" && tag !== "button") { e.preventDefault(); regen.click(); }
    else if (e.key === "c" || e.key === "C") { copyCurrent(); }
  });

  // ---------- Init ----------
  applyTheme();
  setRange("rLen", state.rLen); setRange("mWords", state.mWords); setRange("pLen", state.pLen);
  ["rUpper", "rNum", "rSym", "rAmb", "mCap", "mNum"].forEach(function (id) { $(id).checked = !!state[id]; });
  syncChips();
  if (MODES.indexOf(state.mode) < 0) state.mode = "random";
  setMode(state.mode, false);
  generate(false);
  renderHistory();

  // Offline support when served over http(s) (e.g. GitHub Pages).
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
