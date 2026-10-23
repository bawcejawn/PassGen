// Run: node test/passgen.test.js
const assert = require("assert");
const P = require("../passgen.js");
global.window = {}; require("../words.js"); const W = window.PASSGEN_WORDS;

for (let i = 0; i < 2000; i++) {
  const r = P.randomPassword({ length: 12, upper: true, numbers: true, symbols: true });
  assert.strictEqual(r.value.length, 12);
  assert(/[a-z]/.test(r.value) && /[A-Z]/.test(r.value) && /\d/.test(r.value) && /[^A-Za-z0-9]/.test(r.value), r.value);
}
const amb = P.randomPassword({ length: 200, upper: true, numbers: true, symbols: true, avoidAmbiguous: true }).value;
assert(!/[0O1lI|]/.test(amb));
assert(/^[a-z]+$/.test(P.randomPassword({ length: 30 }).value));

// Uniformity check on randInt
const counts = new Array(7).fill(0);
for (let i = 0; i < 70000; i++) counts[P.randInt(7)]++;
counts.forEach(c => assert(Math.abs(c - 10000) < 600, "biased: " + counts));

const m = P.memorablePassword({ words: 5, separator: "-", capitalize: true, addNumber: true }, W);
assert.strictEqual(m.value.split("-").length, 5);
assert(/\d/.test(m.value) && /^[A-Z]/.test(m.value));
assert(Math.abs(m.bits - (5 * Math.log2(7776) + Math.log2(10) + Math.log2(5))) < 1e-9);
const d = P.memorablePassword({ words: 4, separator: "#" }, W).value;
assert.strictEqual(d.match(/\d/g).length, 3);
assert(/^\d{6}$/.test(P.pin({ length: 6 }).value));
assert.strictEqual(P.rate(20).label, "Weak");
assert.strictEqual(P.rate(130).label, "Very strong");
console.log("all tests passed");
console.log(P.randomPassword({ length: 20, upper: true, numbers: true, symbols: true }), P.rate(20 * Math.log2(87)));
console.log(m.value, P.rate(m.bits));
