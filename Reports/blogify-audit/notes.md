# Blogify audit — 16 October 2026

Scope: public first-time reader journey, discovery → reading → participation → account entry. In-app browser; no account creation or posting.

1. Home — healthy with minor friction. Clear audience, readable previews and engagement metadata. Cookie banner overlays lower article metadata at 1280×720. Navigation has active underline. Check mobile reflow and keyboard behavior separately.

2. Articles — healthy. Three entries are easy to scan; reading time and reactions help selection. Article titles/body share dark text treatment, so clickability is less explicit than standard underlined links. Search/filter unnecessary at this catalog size.

3. Article and comments — needs improvement. Clean paragraphs and explicit login prompts. No visible author/date, related reading, or article-specific return link. Technical commands use ordinary prose, react.dev is plain text. A public test comment undermines polish. Comments heading skips H2 in observed DOM (H1 → H3 → H4).

4. Log in — mostly healthy; context gap. Empty submission shows specific inline errors and focuses Email with visible blue focus. Email exposes aria-invalid=true, aria-describedby=email-error, autocomplete=email. Recovery/signup links clear. Primary button is visually faint. No article title/back-to-article or return reassurance; successful redirect untested. Password visibility control absent.

5. Create account — needs minor improvement. Public display-name purpose and password requirement explicit; persistent labels. No show-password control and confirmation adds typing. Signup omits the commenting/upvoting benefit from home; carry it into the heading support copy. No account submitted.

6. Password recovery — healthy entry. Clearly explains emailed reset link and provides back-to-login. Delivery, confirmation and token flow untested; no reset sent.

7. Mobile home at 390px — healthy in captured state. Navigation fits on one row; article titles and prose wrap without visible clipping. Cookie banner already declined, so mobile consent overlay untested. Other mobile pages/320px/zoom untested.
