# Portal browser checks

The Playwright suite renders `App` with a deterministic repository containing only synthetic roll/admin IDs and student records. Any internal Auth identity used by a harness is non-deliverable and never represents a real mailbox. The harness lives under `tests/e2e` and is not an input to the production Vite build.

Run once per Playwright upgrade:

```sh
npm run test:e2e:install
```

Run the browser suite:

```sh
npm run test:e2e
```

The suite covers desktop Chromium and a Pixel-sized mobile Chromium profile, axe WCAG 2.1 A/AA scans, keyboard-first roll/admin-ID login, the mandatory temporary-password change and explicit re-login notice, result filtering and totals, unified-admin template/upload/review/publish and student-access states, reduced motion, 200%-zoom-equivalent reflow, and production build rendering with the actual `netlify.toml` rewrite and security headers.

Manual or deployed-environment checks still required before launch:

- VoiceOver/TalkBack walkthroughs and real browser zoom controls.
- Firefox, WebKit/Safari, and Windows high-contrast mode.
- Hosted roll/admin-ID sign-in, first-login session replacement, and office-assisted reset through the real `student-account` function. Student email delivery and SMTP are intentionally outside this design.
- Real private-storage upload, both Edge Functions, and same-admin publication against staging data.
- Manual identity verification before displaying or resetting a student's one-time credential; automated browser fixtures cannot validate the institute's human procedure.
- Netlify CDN behavior on a deploy preview; the local server mirrors the committed rewrite and header rules but is not Netlify's edge runtime.
