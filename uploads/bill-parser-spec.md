# Legislative Bill Parser — Full Project Spec for Atoms.dev

## What This App Does (Plain English)

This is a web app that solves a problem no AI tool has solved: **reading legislation the way it's actually written.** When a bill amends existing law, new language is underlined and deleted language has a strikethrough. Every AI chat strips that formatting out, so AI can't tell what's changing. This tool preserves that formatting and makes it readable by AI.

The user pastes the HTML source code of an Illinois bill (from ILGA.gov), and the app:
1. Parses the HTML to detect underline tags (`<u>`, `<ins>`) as NEW language and strikethrough tags (`<del>`, `<s>`, `<strike>`) as DELETED language
2. Displays a color-coded visual diff
3. Generates tagged text with `[NEW]` and `[DELETED]` markers
4. Provides built-in AI analysis via the Anthropic Claude API
5. Lets the user copy the tagged text to paste into any AI chat

---

## Target User

A single user (legislative lobbyist) analyzing Illinois bills. The app should be clean, professional, and functional — not flashy. Think "tool for a professional," not "startup landing page."

---

## Tech Stack Preferences

- Frontend: React or vanilla HTML/CSS/JS — whatever Atoms defaults to is fine
- Backend: Needs a server-side component for URL fetching (to avoid CORS issues when fetching from ilga.gov)
- API: Anthropic Claude API (https://api.anthropic.com/v1/messages) for built-in analysis
- Hosting: Atoms.dev built-in hosting

---

## Pages / Views

### Single Page App with Two Sections:

**Section 1: Input Area (top)**
**Section 2: Results Area (bottom, hidden until a bill is parsed)**

---

## Section 1: Input Area

### Two Input Modes (tabs):

#### Tab 1: "Paste URL" (stretch goal — implement if possible)
- Single text input field for an ILGA.gov URL
- "Parse Bill" button
- The SERVER fetches the HTML from the URL (not the browser — this avoids CORS blocking)
- Hint text: "Paste the URL to any bill's .htm full text on ILGA.gov"

#### Tab 2: "Paste HTML Source" (primary/fallback mode)
- Large textarea for pasting raw HTML source code
- "Parse Bill" button
- Hint text: "Open any bill on ILGA.gov → Right-click → View Page Source → Select All → Copy → Paste here"

#### Both tabs should also have:
- A "Load Demo" button that loads a sample bill excerpt so the user can see the app work immediately
- Clear error messaging if parsing fails or no formatting is detected

### Demo Data

Use this as the demo HTML (this is an excerpt from SB3980 amending EV parking requirements):

```html
<html><body>
<p>Sec. 25. Residential requirements.</p>
<p>(a) All <del>building permits issued 90 days after the effective date of this Act shall require a</del> <u>new or altered</u> large multifamily residential <del>buildings</del> <u>and mixed residential and commercial buildings with residential accessory parking,</u> <del>building</del> or a large multifamily residential building being renovated by a developer converting the property to an association <u>or rental property must follow these requirements</u></p>
<p>for residential accessory parking spaces: 80% EV-capable; 20% <u>EV-ready or EVSE-installed, including at least 1 EVSE-installed space if there are 30 or fewer residential accessory parking spaces and at least 5% EVSE-installed spaces if there are more than 30 residential accessory parking spaces</u> <del>to have 100% of its total parking spaces EV-capable.</del> <u>If requirements under this Section result in a fraction of parking spaces, the required number must round up to the next whole number per building or parking facility, prioritizing EVSE-installed and EV-ready spaces before EV-capable.</u></p>
<p>However, nothing in this Act shall be construed to require that in the case of a developer converting the property to an association<u>, including in cases in which a commercial property</u></p>
</body></html>
```

---

## Section 2: Results Area

### Stats Bar (always visible when results exist)
- Count of new provisions (sections and word count)
- Count of deleted provisions (sections and word count)
- Simple, clean display — two stat cards side by side

### Action Buttons Row
- **"Copy for Any AI"** button — copies tagged text with AI instructions to clipboard. Shows a brief toast notification "Copied!" on click.
- **"Analyze with Claude"** button — sends tagged text to Claude API for analysis

### Three View Tabs:

#### Tab 1: "Visual Diff"
- Displays the parsed bill text with color coding:
  - **NEW language**: Green text with green underline and subtle green background tint
  - **DELETED language**: Red text with strikethrough and subtle red background tint, slightly transparent
  - **UNCHANGED text**: Gray/muted text
- Include a small legend above the display showing what each color means
- Use a serif font for the bill text (it's legislation — should feel like a legal document)
- Line height should be generous (1.8-2.0) for readability

#### Tab 2: "Tagged Text"
- Shows the same text but with visible `[NEW]` and `[DELETED]` markers wrapped around the changed text
- Monospace font
- The tag markers themselves should be colored (green for [NEW], red for [DELETED]) while the text content stays neutral
- Brief label above: "This is what gets sent to AI — your formatting preserved as semantic tags"

#### Tab 3: "AI Analysis"
- Initially shows placeholder text: "Click 'Analyze with Claude' to get AI analysis"
- When analysis is running, shows a pulsing "Analyzing legislative changes..." message
- When complete, displays the analysis in clean, readable prose
- If the API call fails, show a helpful message: "Could not connect to Claude API. Use the 'Copy for Any AI' button to paste the tagged text into any AI chat."

---

## HTML Parsing Logic (Critical — This is the Core of the App)

### Tags to Detect

**NEW language (underline) — these mean text is being ADDED to existing law:**
- `<u>` and `</u>`
- `<U>` and `</U>`
- `<ins>` and `</ins>`
- `<INS>` and `</INS>`
- `<span>` with `text-decoration: underline` in style attribute
- `<span>` with class containing "inserted"

**DELETED language (strikethrough) — these mean text is being REMOVED from existing law:**
- `<del>` and `</del>`
- `<DEL>` and `</DEL>`
- `<s>` and `</s>`
- `<S>` and `</S>`
- `<strike>` and `</strike>`
- `<STRIKE>` and `</STRIKE>`
- `<span>` with `text-decoration: line-through` in style attribute
- `<span>` with class containing "deleted"

### Cleanup Steps (apply before parsing)

1. **Remove line numbers**: ILGA bills include line numbers (1-26 typically) at the start of each line. Strip these out. They appear as standalone numbers in table cells or at the start of lines.
2. **Remove page headers**: Strip out repeated headers like "SB2846 - 5 - LRB104 16878 AAS 30288 b" and similar patterns (bill number + page number + LRB reference).
3. **Decode HTML entities**: Convert `&nbsp;` to spaces, `&amp;` to &, etc.
4. **Collapse whitespace**: Replace multiple consecutive spaces/newlines with single spaces.
5. **Strip non-content tags**: Remove `<table>`, `<tr>`, `<td>` tags (ILGA uses tables for layout, not for content).
6. **Merge adjacent segments**: If two consecutive segments are both NEW or both DELETED, merge them into one.

### Output Data Structure

The parser should produce an array of segments, each with:
```
{
  type: "new" | "deleted" | "unchanged",
  text: "the actual text content"
}
```

### Tagged Text Generation

Convert the segments array to a single string:
- NEW segments: `[NEW] text here [/NEW]`
- DELETED segments: `[DELETED] text here [/DELETED]`
- UNCHANGED segments: just the text

---

## Claude API Integration

### Endpoint
```
POST https://api.anthropic.com/v1/messages
```

### Headers
```
Content-Type: application/json
```
(No API key header needed — this is handled automatically if using Anthropic's artifact/app environment. If deploying standalone, the API key should be stored server-side as an environment variable, NEVER in client-side code.)

### Request Body
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "system": "You are a legislative analyst AI. You are reading bill text that has been specially tagged to preserve legislative formatting:\n\n- Text wrapped in [NEW] ... [/NEW] tags represents NEW LANGUAGE being added to existing law (shown as underlined text in the original bill)\n- Text wrapped in [DELETED] ... [/DELETED] tags represents LANGUAGE BEING REMOVED from existing law (shown as strikethrough text in the original bill)\n- All other text is EXISTING LAW that remains unchanged\n\nYour job is to:\n1. Clearly explain what substantive changes this bill makes\n2. Identify what existing provisions are being removed and what is replacing them\n3. Note the practical impact of these changes\n4. Flag any provisions that seem ambiguous or could have unintended consequences\n\nBe specific and reference the actual language. Do not summarize generically — a legislative professional is reading your analysis.",
  "messages": [
    {
      "role": "user",
      "content": "Analyze the following tagged legislative text. Explain what changes are being made, what is being removed, what is being added, and the practical impact:\n\n{TAGGED_TEXT_HERE}"
    }
  ]
}
```

### Handling Long Bills

Some bills are 100+ pages. The tagged text may exceed Claude's context window. To handle this:

1. If the tagged text is under 15,000 words, send it all at once.
2. If it's over 15,000 words, split it into sections (look for "Section" or "Sec." boundaries in the text) and analyze each section separately.
3. Display a note to the user: "This bill is large. Analysis is broken into sections."
4. Alternatively, if chunking is too complex for v1, just show a message: "This bill exceeds the AI analysis limit. Use the 'Copy for Any AI' button to paste sections into your preferred AI chat." This is an acceptable v1 solution.

---

## Copy Button Behavior

When the user clicks "Copy for Any AI", copy this exact text to the clipboard:

```
LEGISLATIVE BILL ANALYSIS — FORMATTING PRESERVED

INSTRUCTIONS: This is legislative bill text with formatting tags that preserve the original underline and strikethrough formatting from the bill.

• Text in [NEW] ... [/NEW] = NEW LANGUAGE being added to existing law (underlined in the original bill)
• Text in [DELETED] ... [/DELETED] = LANGUAGE BEING REMOVED from existing law (strikethrough in the original bill)
• All other text = EXISTING LAW that remains unchanged

Please analyze what substantive changes this bill makes. Identify what is being removed, what is being added, and the practical impact of each change.

---

{TAGGED_TEXT_HERE}
```

Show a toast notification: "✓ Tagged text copied with AI instructions"

---

## Design Guidelines

### Overall Aesthetic
- Dark theme (dark navy/charcoal background, not pure black)
- Professional and clean — this is a work tool for a legislative professional
- Minimal — no unnecessary decoration, animations, or flashiness

### Typography
- **Bill text display**: Serif font (Georgia, Source Serif, or similar) — legislation should feel like a legal document
- **UI elements, labels, buttons, stats**: Monospace font (JetBrains Mono, Fira Code, or similar) — gives it a technical/tool feel
- **Body text / descriptions**: Clean sans-serif

### Colors
- Background: `#080c15` or similar deep navy
- Card/panel backgrounds: `#0c1221`
- Borders: `#1c2a48`
- Primary accent: `#2952cc` (blue)
- NEW language: `#22c55e` (green) with `rgba(34, 197, 94, 0.07)` background
- DELETED language: `#ef4444` (red) with `rgba(239, 68, 68, 0.06)` background
- Unchanged text: `#7a8eaf` (muted blue-gray)
- Primary text: `#c8d3e6`
- Subtle text: `#3d506e`

### Layout
- Single column, max-width ~860px, centered
- Sticky header with app name
- Generous padding and spacing
- Mobile-responsive (should work on phone/tablet too)

---

## "How It Works" Section (bottom of page)

A small section at the bottom of the page (always visible) with 4 steps in a 2x2 grid:

1. **Paste a bill URL or HTML** from ILGA.gov. The .htm full text versions work best.
2. **Parser detects formatting:** `<u>` and `<ins>` tags = new language. `<del>`, `<s>`, `<strike>` = deleted.
3. **Visual Diff** shows changes color-coded. **Tagged Text** wraps them in [NEW] and [DELETED] markers.
4. **Copy into any AI** — Claude, ChatGPT, Gemini — and it finally understands what the bill actually changes.

---

## Environment Variables Needed

- `ANTHROPIC_API_KEY` — for the Claude API integration. Must be stored server-side only.

---

## File Structure Suggestion

```
/
├── index.html (or App.jsx if React)
├── server.js (or equivalent backend)
│   ├── POST /api/fetch-bill — fetches HTML from ILGA URL
│   ├── POST /api/analyze — proxies request to Claude API
├── parser.js — HTML parsing logic
├── styles.css — all styling
└── .env — ANTHROPIC_API_KEY
```

---

## Future Enhancements (Not for v1, but keep architecture flexible)

- PDF upload and parsing (detect underline/strikethrough from PDF formatting metadata)
- Support for other state legislatures (different states use different formatting conventions)
- Save/export analysis results
- Side-by-side view (original bill + analysis)
- Bill URL auto-detection (paste any ILGA URL format and it figures out the right .htm link)

---

## Summary of Priority

1. **Must have**: Paste HTML source → parse → visual diff → tagged text → copy button
2. **Must have**: Built-in Claude analysis via API
3. **Nice to have**: URL fetch (server-side) so user doesn't need to view source
4. **Nice to have**: Line number / page header cleanup
5. **Future**: PDF parsing, multi-state support
