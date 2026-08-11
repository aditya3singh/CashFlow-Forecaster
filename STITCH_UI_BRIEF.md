# UI Design Brief — SMB Cashflow Forecaster (for Google Stitch)

Copy the sections below directly into Stitch as your prompt. Written in detail so the
generated UI feels premium, trustworthy, and customer-attracting — not a generic dashboard template.

---

## Master prompt (paste this as-is)

```
Design a modern, premium fintech web app called "CashFlow Forecaster" — a tool that
helps small business owners see their future bank balance before they run out of
money. The audience is non-technical small business owners (bakery owners, salon
owners, freelancers, shop owners) who are busy and slightly anxious about money — the
UI must feel calm, trustworthy, and reassuring, like a financial advisor, not a
crowded spreadsheet or a scary trading app.

Design style: Clean, minimal, modern fintech aesthetic — similar to Mercury, Ramp, or
Stripe Dashboard. Lots of white/soft neutral space, one confident accent color, soft
rounded corners (12-16px radius), subtle shadows only (no heavy gradients or neon).
Typography should feel modern and friendly — rounded sans-serif for headings, clean
sans-serif for body text. Avoid anything that looks like a crypto/trading app (no dark
neon greens, no aggressive red/green candlestick charts).

Color palette: A calm deep teal or navy as the primary brand color (trust + finance),
a soft mint/green as the positive/safe accent, a warm coral/amber (not harsh red) for
warnings so it feels helpful rather than alarming, and a warm off-white/cream
background instead of stark white or black, to feel approachable rather than clinical.

Generate the following screens:
```

---

## Screen-by-screen details (include each of these in Stitch)

### 1. Landing / Marketing page
```
A landing page for CashFlow Forecaster. Hero section with a bold, reassuring headline
like "Know your cash flow before it's a problem" and a subheadline explaining it
predicts your bank balance 2-6 weeks ahead and warns you before a shortfall. Include a
large, friendly illustration or a stylized preview of the forecast chart showing a
smooth line dipping and recovering, not scary numbers. A prominent "Connect your bank
— it's free to try" CTA button. Below the hero: 3 simple feature cards with icons —
"See your future balance", "Get alerted before you're short", "Add expected income
manually". A trust section with small text like "Bank-level encryption. Read-only
access. We can never move your money." A simple footer.
```

### 2. Sign up / Login
```
A clean, centered signup/login card on a soft cream background. Minimal form: email,
password, business name. Friendly microcopy under the button like "Takes less than 2
minutes." A small illustration or icon reinforcing security/trust next to the form.
```

### 3. Onboarding — Connect bank account
```
A focused, single-purpose screen guiding the user to connect their bank account via
Plaid. Large reassuring headline: "Connect your bank to see your forecast." A short
3-step visual indicator above it (Connect → Sync → See Forecast) so the user knows
what's happening. One large primary button "Connect bank account." Small reassuring
text below: "Read-only. We never store your bank password. You can disconnect
anytime." Keep this screen very sparse — no distractions.
```

### 4. Main Dashboard (the most important screen)
```
The core dashboard screen for a logged-in user. Top left: current balance shown very
large and bold, like "$12,450.30", with a small label "Current balance" above it and
the connected bank name below it in muted text. Below that: a smooth line chart
showing the projected balance over the next 6 weeks, with a soft mint-green fill under
the line when balance is healthy, and the line subtly shifting to a warm amber color
if it dips near or below zero — with a horizontal dashed reference line at $0. If
there's a projected shortfall, show a calm but noticeable banner above the chart:
"Heads up — you're projected to be short by $420 on Sep 3" with a small "See why" link,
styled in warm amber, not alarming red. To the right or below the chart: a card listing
upcoming known transactions (payroll, rent) and a button "+ Add expected income or
expense" for manual overrides. Keep a left sidebar with simple nav icons: Dashboard,
Transactions, Settings, and the business name/logo at top.
```

### 5. Transactions view
```
A simple, scannable list of recent bank transactions grouped by date, each row showing
merchant name, category tag (small colored pill), and amount (green for inflow, muted
gray for outflow — avoid harsh red for normal expenses). A small "manual" badge on
any user-added expected transactions to distinguish them from real bank data.
```

### 6. Settings
```
A clean settings page with sections: Connected bank account (with a "Reconnect" or
"Disconnect" option and last synced time), Alert preferences (a simple toggle and an
input for "alert me if balance will go below $___"), and Account (email, password,
logout). Use simple form rows with clear labels, generous spacing, and no clutter.
```

### 7. Empty / loading states
```
A friendly empty state for a brand-new user with no bank connected yet — a simple
illustration and the message "Connect your bank to see your first forecast" with a
CTA button. A calm loading state for when a forecast is being generated — a subtle
skeleton loader on the chart area, not a spinner, so it doesn't feel slow.
```

---

## Extra direction notes (helps Stitch avoid generic output)

- **Vibe in one line**: "A financial co-pilot for a small business owner, not a
  trading terminal."
- **Avoid**: dark mode by default, neon/glowing effects, dense data tables on the main
  dashboard, red-heavy alert styling, generic stock-photo people.
- **Favor**: rounded cards, soft shadows, one confident accent color used sparingly,
  generous whitespace, a chart that's the visual hero of the dashboard, microcopy that
  sounds human ("Heads up" instead of "WARNING").
- **Mobile**: also generate a responsive mobile version of the dashboard — stacked
  layout, balance and chart full-width, sidebar becomes a bottom nav bar.

---

## How to use this
1. Paste the **Master prompt** first in Stitch to set the overall style.
2. Then generate each screen one at a time using its own prompt block above — this
   gives Stitch a clear, focused brief per screen instead of one giant vague prompt,
   which produces much better results.
3. Keep the color palette and vibe line consistent across every screen prompt so
   Stitch doesn't drift in style between screens.
