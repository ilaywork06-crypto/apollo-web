# apollo-web

The landing page for עמוס עטיה's pension-planning office. It shows visitors a sample AmoSight report
(an invented, anonymous client) and asks them to leave their details.

A static site: HTML, CSS and plain JavaScript, with no build step and no dependencies.

## Before going live

All the office's details live in [`assets/js/config.js`](assets/js/config.js):

| Field | What it is |
|-------|------------|
| `phone` | The phone number as people should dial it |
| `whatsapp` | The same number in international format, digits only (`050-1234567` → `972501234567`) |
| `email` | Optional; the email row is hidden when it is empty |
| `role` | The exact title on the license (`יועץ פנסיוני`, `סוכן ביטוח פנסיוני`, …) |
| `license` | The license number, shown in the footer |
| `formEndpoint` | Optional, see below |

Also:

- `og:image` in `index.html` must be a full URL (`https://<domain>/assets/img/og-image.png`) for
  WhatsApp and Facebook to show the link preview.
- The "מי אנחנו" text in `index.html` is generic; replace it with Amos's own story, and the `ע״ע`
  monogram with a photo (the comment there shows how).
- Israeli law requires an accessibility statement (הצהרת נגישות) on a business site.

## The contact form

With `formEndpoint` empty, sending the form opens WhatsApp with the details already written; the
visitor still taps "send". To receive leads without WhatsApp, point `formEndpoint` at any service
that accepts a JSON `POST` (Formspree, a Google Apps Script web app, …). The body is
`{ name, phone, products: [...], note }`.

## The sample report

The sample client lives in `SAMPLE` in [`assets/js/site.js`](assets/js/site.js). Everything else
(potential balances, the missed amount, the weighted score, percentiles) is computed from it the
way AmoSight computes it, so editing a return or a balance keeps every figure consistent. The names
of the leading funds are hidden on purpose: the visitor sees them in their own report.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Any static host works. On GitHub Pages: Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## The link preview image

`assets/img/og-image.png` is a screenshot of [`og/og.html`](og/og.html) at 1200×630. After editing that
page, serve the repo as above and take a new screenshot at `deviceScaleFactor: 1` (at 2x headless
Chromium draws Hebrew reversed).
