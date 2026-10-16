# Blogify UX and accessibility audit

Date: 16 October 2026
Source: https://app.ronirachmani.com/

## Verdict and scope
The public reader journey is straightforward and readable. No blocking navigation problem appeared in the observed path. The largest opportunities concern continuity into account entry, article usefulness, and trust. This is a combined UX and accessibility review of the public journey, not an end-to-end authenticated audit.

Goal: discover a practical JavaScript article, read it, and find how to join its conversation. Desktop captures used 1280×720; mobile home used 390×844. Screenshots are from this run and were saved and inspected individually.

## Prioritized recommendations

1. **Medium — preserve article context through authentication (steps 3–5).** Clicking the comment login prompt opens a generic /login page. The form shows no article title, back-to-article link, or promise to return. Add “Log in to comment on The Fastest Way to Learn React,” keep the intended destination through signup, and return to the comment area after authentication. The observed issue is missing context; successful redirect behavior was not tested.
2. **Medium — make article instructions usable and give readers a next step (step 3).** The Vite command and React API names look like ordinary prose; react.dev is plain text. Use code styling for commands and APIs, link the documentation, and add a related article or explicit return-to-list action after the article. Global Articles navigation remains available.
3. **Medium — remove public test content and improve provenance (step 3).** A comment explicitly describes testing author display names. Remove that fixture through normal moderation and keep future test data out of public content. Add an author and updated date so readers can judge technical freshness. No content was changed during this audit.
4. **Low — increase primary action emphasis (steps 4–6).** Pale form buttons have much less visual emphasis than the dark navigation. Use one consistent, distinct primary-button treatment and preserve a visible keyboard focus state. This is a hierarchy finding, not a measured contrast failure.
5. **Low — strengthen article link affordance (steps 1–2).** Titles and summaries appear as dark text despite the entire entry being a link. An underlined title or consistent link styling would make opening an article more obvious.
6. **Low — improve password entry ergonomics (steps 4–5).** Add accessible show/hide controls. Consider whether confirmation is needed once users can inspect the password. Keep the useful requirement hint and clear display-name explanation.
7. **Low — repair heading hierarchy (step 3).** The observed DOM uses H1 for the article, H3 for Comments, and H4 for names. Use H2 for Comments and H3 for comment subheadings if headings are needed there.

## Captured steps

### 1. Home — healthy, minor friction
Clear audience and purpose; previews and reaction counts help readers choose. The fixed cookie banner overlays lower content at the captured desktop viewport; equal Accept/Decline actions and later Cookie settings are helpful. Keep dismissal easy and check that the overlay never traps or hides a focused control.

![Home](01-home.png)

### 2. Article list — healthy
All three articles are scannable, with excerpts and reading time. Search and filters would add little at this catalog size. Improve title clickability before adding more controls.

![Articles](02-articles.png)

### 3. Article and conversation — needs improvement
Body text and spacing are clear. Login prompts explain why authentication is required. Improve code presentation, source links, author/date, onward reading, and the test comment. The Comments heading skips a level in the observed DOM.

![Article and comments](03-article.png)

### 4. Login and empty validation — mostly healthy
Persistent labels and signup/recovery routes are clear. Empty submission produces specific errors and focuses Email with a visible blue outline. The Email field exposes aria-invalid=true, aria-describedby=email-error, type=email, and autocomplete=email. Carry the originating article context into this screen and strengthen the primary button.

![Login](04-login.png)

![Empty submission errors](04b-login-validation.png)

### 5. Create account — minor friction
The display-name label explains public use; the password requirement is visible. Add the participation benefit near the heading and a password visibility control. The confirmation field adds another typing step. The form was inspected without creating an account.

![Create account](05-create-account.png)

### 6. Recovery entry — healthy
The page explains the emailed link and offers a clear route back to login. No email was entered and no reset link was sent.

![Recovery](06-recovery.png)

### 7. Mobile home — healthy at tested width
At 390px the four navigation links fit, text wraps, and no visible clipping appears. Consent had already been declined; this does not establish that the mobile banner is unobtrusive.

![Mobile home](07-mobile-home.png)

## Accessibility evidence and limits

Confirmed: headings and named navigation links are present, a skip-to-content link appears in the accessibility tree, persistent form labels are exposed, and empty login errors include focus management and Email error association. The active navigation item is visibly underlined, rather than indicated by color alone.

Risk: skipped article heading level can make heading navigation less predictable. Whole article-card link names include title, excerpt and metadata, which may be verbose in a screen reader links list. Check with assistive technology before changing the accessible names.

Not verified: full keyboard sequence or skip-link destination focus, screen-reader announcements, measured color contrast, all target dimensions, 200–400% zoom, 320px reflow, reduced motion, other mobile pages, mobile cookie consent, successful authentication and return navigation, account verification, authenticated voting/commenting, server error handling, password-reset email delivery, or security. Screenshots alone do not establish WCAG compliance.

Recommended next pass: implement article-aware authentication entry and verify a complete sign-in → return-to-comment journey with a test account.
