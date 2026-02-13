# Legislative Bill Parser - Development Plan

## Design Guidelines

### Design References
- **Style**: Professional Legislative Tool + Dark Technical Interface
- Inspiration: GitHub Dark Theme, VS Code Dark+ Theme, Legal Document Readers

### Color Palette
- Background: #080c15 (Deep Navy)
- Card/Panel: #0c1221 (Dark Navy)
- Borders: #1c2a48 (Navy Blue)
- Primary Accent: #2952cc (Blue)
- NEW Language: #22c55e (Green) with rgba(34, 197, 94, 0.07) background
- DELETED Language: #ef4444 (Red) with rgba(239, 68, 68, 0.06) background
- Unchanged Text: #7a8eaf (Muted Blue-Gray)
- Primary Text: #c8d3e6 (Light Blue-Gray)
- Subtle Text: #3d506e (Dark Blue-Gray)

### Typography
- **Bill Text Display**: Serif font (Georgia, Source Serif Pro) - legal document feel
- **UI Elements/Labels/Buttons/Stats**: Monospace font (JetBrains Mono, Fira Code) - technical tool feel
- **Body Text/Descriptions**: Sans-serif (Inter, System UI)
- **Line Height**: 1.8-2.0 for bill text readability

### Layout & Spacing
- Single column layout, max-width 860px, centered
- Sticky header with app name
- Generous padding (24px-32px sections)
- Mobile-responsive breakpoints
- Card-based sections with subtle borders

---

## Development Tasks

### 1. Backend Setup
**Directory**: `/workspace/app/backend`

#### 1.1 Install Dependencies
- Add `httpx` for fetching ILGA.gov URLs
- Add `beautifulsoup4` for HTML parsing
- Add `lxml` parser for BeautifulSoup

#### 1.2 Create Bill Fetcher Service (`backend/services/bill_fetcher.py`)
- Implement async function to fetch HTML from ILGA.gov URLs
- Handle CORS by server-side fetching
- Error handling for network issues, invalid URLs
- Timeout configuration (30 seconds)

#### 1.3 Create HTML Parser Service (`backend/services/bill_parser.py`)
- Detect NEW language tags: `<u>`, `<ins>`, `<U>`, `<INS>`, span with underline style
- Detect DELETED language tags: `<del>`, `<s>`, `<strike>`, `<DEL>`, `<S>`, `<STRIKE>`, span with line-through
- Cleanup steps:
  - Remove line numbers (1-26 patterns)
  - Remove page headers (bill number + page + LRB reference patterns)
  - Decode HTML entities (&nbsp;, &amp;, etc.)
  - Collapse whitespace
  - Strip non-content tags (table, tr, td)
  - Merge adjacent segments of same type
- Output structure: array of `{type: "new"|"deleted"|"unchanged", text: "..."}`
- Generate tagged text with [NEW] and [DELETED] markers
- Calculate statistics (word counts, provision counts)

#### 1.4 Create Claude Analysis Service (`backend/services/claude_analyzer.py`)
- Use Anthropic API key from environment variable
- Implement streaming analysis with claude-4-5-sonnet
- System prompt for legislative analysis
- Handle long bills (check 15,000 word limit)
- Error handling and fallback messages

#### 1.5 Create API Routes (`backend/routers/bills.py`)
- POST `/api/v1/bills/fetch` - fetch HTML from ILGA.gov URL
  - Request: `{url: string}`
  - Response: `{html: string, success: boolean, error?: string}`
- POST `/api/v1/bills/parse` - parse HTML and return segments
  - Request: `{html: string}`
  - Response: `{segments: array, taggedText: string, stats: object, success: boolean}`
- POST `/api/v1/bills/analyze` - analyze with Claude (streaming)
  - Request: `{taggedText: string}`
  - Response: Server-Sent Events stream

### 2. Frontend Implementation
**Directory**: `/workspace/app/frontend/src`

#### 2.1 Update App Structure (`src/App.tsx`)
- Single route for main parser page
- Keep Toaster for notifications

#### 2.2 Create Main Parser Page (`src/pages/BillParser.tsx`)
- Sticky header with app name "Legislative Bill Parser"
- Two-section layout: Input Area (top) + Results Area (bottom, conditional)
- Responsive container (max-width 860px)

#### 2.3 Create Input Area Component (`src/components/InputArea.tsx`)
- Tab switcher: "Paste URL" and "Paste HTML Source"
- URL input mode:
  - Text input for ILGA.gov URL
  - Hint text about .htm full text versions
- HTML input mode:
  - Large textarea (min-height 300px)
  - Hint text about View Page Source workflow
- "Load Demo" button (loads SB3980 excerpt)
- "Parse Bill" button
- Error message display area
- Loading state during parsing

#### 2.4 Create Results Area Component (`src/components/ResultsArea.tsx`)
- Stats bar with two cards:
  - NEW provisions count + word count
  - DELETED provisions count + word count
- Action buttons row:
  - "Copy for Any AI" button (with copy icon)
  - "Analyze with Claude" button (with sparkle icon)
- Tab switcher: "Visual Diff", "Tagged Text", "AI Analysis"
- Conditional rendering based on selected tab

#### 2.5 Create Visual Diff Component (`src/components/VisualDiff.tsx`)
- Color legend at top (NEW = green, DELETED = red, UNCHANGED = gray)
- Render segments with appropriate styling:
  - NEW: green text, green underline, subtle green background
  - DELETED: red text, strikethrough, subtle red background, slight transparency
  - UNCHANGED: muted gray text
- Serif font (Georgia or Source Serif Pro)
- Generous line height (1.8-2.0)
- Preserve paragraph structure

#### 2.6 Create Tagged Text Component (`src/components/TaggedText.tsx`)
- Monospace font display
- Color-coded tag markers:
  - [NEW] and [/NEW] in green
  - [DELETED] and [/DELETED] in red
  - Text content in neutral color
- Label: "This is what gets sent to AI — your formatting preserved as semantic tags"
- Scrollable container

#### 2.7 Create AI Analysis Component (`src/components/AIAnalysis.tsx`)
- Placeholder state: "Click 'Analyze with Claude' to get AI analysis"
- Loading state: Pulsing animation with "Analyzing legislative changes..."
- Analysis display: Clean prose formatting
- Error state: Helpful message about using Copy button as fallback
- Streaming text display (append chunks as they arrive)

#### 2.8 Create How It Works Section (`src/components/HowItWorks.tsx`)
- Always visible at page bottom
- 2x2 grid layout (responsive to 1 column on mobile)
- 4 steps with icons:
  1. Paste bill URL or HTML from ILGA.gov
  2. Parser detects formatting tags
  3. Visual Diff and Tagged Text views
  4. Copy into any AI tool
- Subtle styling, informational tone

#### 2.9 Implement Copy Functionality
- Format clipboard text with instructions header
- Include tag explanations
- Append tagged text
- Show toast notification: "✓ Tagged text copied with AI instructions"

#### 2.10 Create Demo Data Constant
- Store SB3980 excerpt HTML
- Make easily accessible for "Load Demo" button

### 3. Styling
**File**: `src/index.css`

#### 3.1 Global Styles
- Dark theme base colors
- Typography scale
- Spacing utilities
- Scrollbar styling (dark theme)

#### 3.2 Component-Specific Styles
- Card/panel backgrounds with borders
- Button styles (primary, secondary)
- Tab switcher styles
- Input/textarea dark theme styling
- Stats card styling
- Color-coded text segments
- Monospace code blocks
- Loading animations

### 4. Integration & Testing

#### 4.1 Connect Frontend to Backend
- Install @metagptx/web-sdk
- Create API client instance
- Implement fetch bill function (POST to /api/v1/bills/fetch)
- Implement parse bill function (POST to /api/v1/bills/parse)
- Implement analyze function (SSE stream from /api/v1/bills/analyze)

#### 4.2 Error Handling
- Network errors
- Parsing failures (no formatting detected)
- API rate limits
- Long bill warnings (>15,000 words)
- Invalid URL formats

#### 4.3 Loading States
- Fetching URL
- Parsing HTML
- Analyzing with Claude
- Skeleton loaders where appropriate

### 5. Final Polish

#### 5.1 Accessibility
- Proper ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support for stats

#### 5.2 Mobile Responsiveness
- Stack layout on small screens
- Touch-friendly button sizes
- Readable font sizes on mobile
- Collapsible sections if needed

#### 5.3 Performance
- Debounce parse button clicks
- Optimize large bill rendering
- Lazy load analysis tab content

#### 5.4 Update Page Title
- Change index.html title to "Legislative Bill Parser"
- Add meta description

---

## Implementation Order

1. Backend services and routes first (bill fetcher, parser, Claude analyzer)
2. Frontend components (input area, results area, tabs)
3. Styling and theme application
4. Integration and API connections
5. Testing with demo data and real ILGA.gov bills
6. Final polish and responsiveness