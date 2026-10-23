// PassGen core: pure functions, no DOM. Works in browsers and Node (for tests).
(function (root) {
  "use strict";

  var cryptoObj = (typeof crypto !== "undefined" && crypto.getRandomValues) ? crypto
    : (typeof require === "function" ? require("crypto").webcrypto : null);
  if (!cryptoObj) throw new Error("No secure random source available");

  // Unbiased integer in [0, n) via rejection sampling.
  function randInt(n) {
    if (n <= 0 || n > 0x100000000) throw new RangeError("bad range");
    var limit = 0x100000000 - (0x100000000 % n);
    var buf = new Uint32Array(1);
    for (;;) {
      cryptoObj.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % n;
    }
  }
  function pick(str) { return str[randInt(str.length)]; }

  var SETS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/~"
  };
  var AMBIGUOUS = /[0O1lI|oQ5S2Z8B`'"]/g;

  function randomPassword(o) {
    var len = o.length, groups = [SETS.lower];
    if (o.upper) groups.push(SETS.upper);
    if (o.numbers) groups.push(SETS.digits);
    if (o.symbols) groups.push(SETS.symbols);
    if (o.avoidAmbiguous) groups = groups.map(function (g) { return g.replace(AMBIGUOUS, ""); });
    var pool = groups.join("");
    // Generate uniformly, retry until every chosen group appears (keeps the
    // distribution uniform over all valid passwords).
    var pw, tries = 0;
    do {
      pw = "";
      for (var i = 0; i < len; i++) pw += pick(pool);
      tries++;
    } while (len >= groups.length && tries < 1000 && !groups.every(function (g) {
      for (var j = 0; j < pw.length; j++) if (g.indexOf(pw[j]) !== -1) return true;
      return false;
    }));
    return { value: pw, bits: len * Math.log2(pool.length) };
  }

  function memorablePassword(o, words) {
    var n = o.words, list = [], bits = n * Math.log2(words.length);
    for (var i = 0; i < n; i++) {
      var w = words[randInt(words.length)];
      if (o.capitalize) w = w.charAt(0).toUpperCase() + w.slice(1);
      list.push(w);
    }
    if (o.addNumber) {
      var k = randInt(n);
      list[k] += String(randInt(10));
      bits += Math.log2(10) + Math.log2(n);
    }
    var out;
    if (o.separator === "#") {
      out = list[0];
      for (var m = 1; m < n; m++) out += String(randInt(10)) + list[m];
      bits += (n - 1) * Math.log2(10);
    } else {
      out = list.join(o.separator);
    }
    return { value: out, bits: bits };
  }

  function pin(o) {
    var s = "";
    for (var i = 0; i < o.length; i++) s += String(randInt(10));
    return { value: s, bits: o.length * Math.log2(10) };
  }

  // Rough strength rating & offline crack time at 10 billion guesses/sec.
  function rate(bits) {
    var label, level;
    if (bits < 36) { label = "Weak"; level = 1; }
    else if (bits < 60) { label = "Fair"; level = 2; }
    else if (bits < 80) { label = "Strong"; level = 3; }
    else { label = "Very strong"; level = 4; }
    var seconds = Math.pow(2, bits - 1) / 1e10;
    return { label: label, level: level, crack: humanTime(seconds) };
  }
  function humanTime(s) {
    if (s < 1) return "instantly";
    var units = [["second", 60], ["minute", 60], ["hour", 24], ["day", 365], ["year", 1e3], ["thousand years", 1e3], ["million years", 1e3], ["billion years", 1e3]];
    var v = s;
    for (var i = 0; i < units.length; i++) {
      if (v < units[i][1]) {
        var r = Math.floor(v);
        var name = units[i][0];
        if (i < 5 && r !== 1) name += "s";
        return r + " " + name;
      }
      v /= units[i][1];
    }
    return "forever";
  }

  var api = { randInt: randInt, randomPassword: randomPassword, memorablePassword: memorablePassword, pin: pin, rate: rate, SETS: SETS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PassGen = api;
})(this);
