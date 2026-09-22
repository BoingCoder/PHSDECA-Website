# PHS DECA website maintenance

The public site uses the static HTML pages in `Website/`. The homepage keeps the Blue Hour sequence in `src/prototypes/`; the older React files under `src/components/` are not mounted by the current Vite entry points.

## Update confirmed content

- `data/events.js` contains the upcoming NJ DECA dates and the supplied photo archive. Keep PHS-specific dates marked pending until the advisor confirms the exact date, time, location, and action. Association dates should link to the source calendar.
- `index.html` contains the chapter overview, supplied photography, and the officer-roster pending state. Add names and roles only after the chapter confirms the current school year roster.
- `join.html` contains the current public New Jersey eligibility and dues summary. Recheck the official NJ DECA profile before changing the amount or course requirements.
- `resources.html` links to official DECA competition guidance and DECA+. Do not copy DECA+ exams, scenarios, written samples, or other licensed material into this repository.
- `shop.html` is intentionally a forthcoming state. Add a product only when the chapter has a confirmed mockup, price, sizes, order window, pickup details, and a real destination for interest or ordering.
- Public chapter photos use the derivatives in `public/images/optimized/`. Keep the original supplied files as source material and regenerate a suitably sized derivative when replacing a photo.

## Shared site behavior

`src/siteChrome.js` renders the header, mobile navigation, and footer on the public pages. `src/motion.js` is the shared GSAP and ScrollTrigger entry. `src/smoothScroll.js` prevents more than one smooth-scroll controller from being created when the homepage loads both the shared site script and Blue Hour.

The Blue Hour opening is intentionally long and scroll-driven. Keep its percentage intro, 3D diamond, `journey` height, and `ScrollTrigger` timeline intact unless the chapter explicitly changes the experience. The scene has a still fallback, a pause control, and reduced-motion behavior.

## Local commands

Run from `Website/`:

```bash
npm install
npm run dev
npm run lint
npm run build
```

Before publishing content, check the public pages at desktop, ultrawide, tablet, and mobile widths. Test the skip link, mobile navigation, visible focus, internal links, external links, reduced motion, and the Blue Hour fallback.
