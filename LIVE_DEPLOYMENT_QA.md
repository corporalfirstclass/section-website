# Live deployment QA gate

No release may be promoted to LIVE unless every required item below passes.
Record the tested commit, URLs, tester and time in the deployment handoff.

## 1. Release identity and rollback

- [ ] Exact Git commit is recorded.
- [ ] Working tree is clean; only reviewed files are included.
- [ ] Previous successful Firebase rollout is identified for rollback.
- [ ] Runtime is Node 22 and required Firebase environment variables remain set.

## 2. Automated preflight

- [ ] Run `npm ci` when dependencies or the lockfile changed.
- [ ] Run `npm run qa:live`.
- [ ] Lint has no errors.
- [ ] Production build completes.
- [ ] Automated tests all pass.
- [ ] Do not deploy if any command exits unsuccessfully.

## 3. Staging functional checks

- [ ] Homepage loads without visible errors.
- [ ] About Us, Design + Tech, Our Works and Contact Us load.
- [ ] Privacy Policy and PDPA Policy load.
- [ ] Header navigation, mobile menu, footer and external links work.
- [ ] Important images and logos load; no broken-image placeholders appear.
- [ ] CMS sign-in succeeds with the approved editor account.
- [ ] Each CMS content section opens: Pages, Projects, Leadership, Offices, Images and Enquiries.
- [ ] Save draft works without changing the public page.
- [ ] Publish updates the intended public page only.
- [ ] Contact form rejects invalid input and accepts a valid test enquiry.
- [ ] Enquiry appears in the CMS and email-delivery status is recorded.

## 4. Responsive checks

Test all key pages and the authenticated CMS at:

- [ ] Mobile: 390 × 844.
- [ ] Tablet: 768 × 1024.
- [ ] Desktop: 1440 × 900.
- [ ] No horizontal page overflow at any size.
- [ ] No clipped navigation, headings, forms, buttons or cards.
- [ ] Tap targets are usable and form fields remain readable.
- [ ] Images retain sensible proportions and do not cover text.

## 5. Quality, accessibility and safety

- [ ] Browser console has no new application errors.
- [ ] Page titles and primary headings are present.
- [ ] Keyboard focus is visible for navigation and forms.
- [ ] Form labels, error messages and buttons are understandable.
- [ ] Staging remains `noindex, nofollow`.
- [ ] No password, API key, session secret or private data is committed.
- [ ] CMS and write APIs reject unauthenticated requests.

## 6. LIVE promotion

- [ ] Staging URL and exact commit are approved.
- [ ] Deploy the exact archive produced from that commit.
- [ ] Confirm Firebase rollout reports success before announcing completion.
- [ ] Recheck Homepage, Our Works, Contact Us and CMS on LIVE.
- [ ] Repeat mobile, tablet and desktop overflow checks on LIVE.
- [ ] Confirm contact enquiries still target `corporal@wearesection.com`.
- [ ] Record the LIVE URL, rollout time and rollback release.

## Deployment handoff

| Field | Value |
| --- | --- |
| Commit | |
| Staging URL | |
| LIVE URL | |
| QA run time | |
| Tester | |
| Automated gate | PASS / FAIL |
| Responsive gate | PASS / FAIL |
| Functional gate | PASS / FAIL |
| Firebase rollout | SUCCESS / FAILED |
| Rollback release | |
| Notes | |

