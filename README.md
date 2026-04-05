# FairDraw

> Fair draws anyone can check.

**FairDraw** runs tournament draws, lottery picks, and group assignments that anyone can independently check. No trust required — just math.

## How it works

1. **Set up your draw** — Add your teams, names, or items. Set group sizes and any rules (like "no two teams from the same country in one group").

2. **Pick a public number** — Roll dice on camera, use an independent internet randomness source, or let multiple people each contribute a number. Everyone sees the number. Nobody can change it.

3. **Get your result — with a receipt** — The draw runs instantly. You get a shareable link. Anyone with that link can re-run the exact same draw and confirm the result is real.

## Why does this matter?

- In 2021, UEFA voided and redid a Champions League draw on live TV due to a software error
- In 2025, a mathematician proved FIFA's own draw method is biased
- Millions of housing and school lottery applicants have no way to check if their draw was fair

**FairDraw** gives you the receipt.

## Built on ancient math

The core method was invented by Narayana Pandita, an Indian mathematician, in 1356 CE — over 600 years before it was independently rediscovered in the West.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- WebCrypto API (no backend, no server)
- Format-Preserving Encryption via unbalanced Feistel cipher
- Combinadic rank/unrank (Narayana's algorithm)
- Web Worker for non-blocking crypto

## Development

```bash
pnpm install
pnpm dev         # Start dev server
pnpm test        # Run crypto unit tests
pnpm build       # Production build
```

## Open source

All code is open. Inspect it yourself. No server, no backend — everything runs in your browser.

## License

MIT — NarayanaKit Contributors
