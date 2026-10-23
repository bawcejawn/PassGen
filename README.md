# PassGen

A fast, private password generator that runs entirely in your browser.

**Live:** https://bawcejawn.github.io/PassGen/

## Features

- **Random** — 8–100 characters, toggle uppercase, numbers, symbols, and look-alike characters (0/O, 1/l/I). Every selected character type is guaranteed to appear.
- **Memorable** — 3–12 words from the EFF long wordlist (7,776 words), choice of separator (`-` `.` `_` `,` space, or random digits), optional capitals and a number.
- **PIN** — 4–12 digits.
- Live strength meter with entropy (bits) and an estimated time to crack.
- One-click copy, recent list (this tab only, masked by default), light/dark theme.
- Keyboard: **Space**/**Enter** = new password, **C** = copy, ←/→ to switch modes.
- Installable and works offline once visited.

## Security

- Randomness comes from `crypto.getRandomValues` with rejection sampling, so there is no modulo bias.
- Nothing is sent over the network, written to disk, or logged. Only your option choices (length, toggles, theme) are saved in your browser's local storage; generated passwords are never stored.
- No third-party scripts, fonts, analytics, or trackers.

## Use it locally

Download or clone the repo and open `index.html` in any browser. No install or build step.

```bash
git clone https://github.com/bawcejawn/PassGen.git
open PassGen/index.html        # macOS  (Windows: start, Linux: xdg-open)
```

## Tests

```bash
node test/passgen.test.js
```

## Credits

Memorable passwords use the [EFF Long Wordlist](https://www.eff.org/dice), licensed CC BY 3.0.
