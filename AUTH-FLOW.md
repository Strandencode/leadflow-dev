# Auth Flow Design — Target State (Session 4+)

Spec for the new sign-in, sign-up, and invitation flows once Better Auth
is the primary auth layer. This doc is the blueprint for Sessions 2–5 UI
work. It reflects the brand (Granskog Noir: Ink grounds, Sage inflection,
monospace labels) and closes the security findings from the review.

---

## Principles

1. **One screen, three tabs, one primary action.** Login, signup and
   "forgot password" live on the same page. Users never wonder which
   screen they're on.
2. **Password is the path of least resistance, magic link is the
   fallback.** Norwegian B2B users expect passwords. But we offer magic
   link + OAuth below the form for anyone who doesn't want to remember.
3. **Invitations are identity-aware.** The invite page renders differently
   based on whether you're signed out, signed in as the invited email, or
   signed in as someone else. No silent hijacks (closes security #1).
4. **No friction without reason.** Email verification is required (closes
   security #4), but we send the verification email the instant the user
   clicks "Opprett konto" — no extra "click to verify" step first.
5. **Errors inline, confirmations in toasts.** Field-level validation
   appears beneath the offending input. Success states confirm at the
   top-right where they don't block the next action.

---

## Surfaces

### `/login` — Unified sign-in + sign-up

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                [ Vekstor wordmark ]              │
│         GROWTH INTELLIGENCE · NORGE              │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ [ Logg inn ] [ Opprett konto ]             │  │
│  │                                            │  │
│  │  E-post                                    │  │
│  │  [_______________________________]         │  │
│  │                                            │  │
│  │  Passord                    [Vis]          │  │
│  │  [_______________________________]         │  │
│  │                          Glemt passord?    │  │
│  │                                            │  │
│  │  [       Logg inn         →  ]             │  │
│  │                                            │  │
│  │  ─────────── eller ────────────            │  │
│  │                                            │  │
│  │  [ Send magisk lenke til e-post ]          │  │
│  │  [ ⌂ Fortsett med Google ]  (session 5+)   │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│          Brukt av 120+ norske bedrifter          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Sign-in tab (default):**
- Email + password form.
- Secondary "Send magisk lenke til e-post" — triggers
  `authClient.signIn.magicLink({ email })` with a 10-minute expiry.
- "Glemt passord?" opens an inline dialog instead of navigating away —
  user types email → toast "Sjekk e-posten" → stays on login screen.

**Sign-up tab:**
- Email + password (password meter appears as you type).
- Password is validated client-side *and* server-side against Better
  Auth's `minPasswordLength: 10` and a breach-check hook.
- No "full name" / "company name" up-front — ask those in onboarding
  once the email is verified. Fewer fields to abandon on.
- Submit → verification email sent → inline banner:
  *"Sjekk {email} for en bekreftelseslenke. Du kan lukke fanen."*
- If the user is accepting an invite (came from `/invite/:token` and
  clicked "Opprett konto"), the email field is **pre-filled and
  read-only** so the mismatch attack isn't possible (closes #1).

**Forgot-password state:**
- Lightweight overlay on the login tab. No separate route.
- After submit: *"Tilbakestillingslenke sendt til {email}. Sjekk
  innboksen din — og spam."*

### `/verify-email?token=…`

Lands here after clicking the verification link.

```
┌──────────────────────────────────────────────────┐
│                                                  │
│               [ Vekstor mark ]                   │
│                                                  │
│      ✓  E-posten din er bekreftet!               │
│                                                  │
│  Du logges automatisk inn om 3 sekunder…         │
│                                                  │
│           [ Gå til dashbordet  → ]               │
│                                                  │
└──────────────────────────────────────────────────┘
```

If the token is invalid/expired:
- Show the mono label `LENKEN ER UTLØPT`, short explanation, and a
  "Send ny bekreftelseslenke" button that re-triggers
  `authClient.sendVerificationEmail({ email })` — email pre-filled from
  the token payload where possible.

### `/reset-password?token=…`

Same pattern. Minimal form with two password fields (new + confirm),
strength meter, match indicator. On submit →
`authClient.resetPassword({ newPassword, token })` →
*"Passordet er oppdatert"* → redirect to `/login` with the email
pre-filled.

### `/invite/:token` — Identity-aware invitation

The invite page has **four states** based on the current session:

**State A — Not signed in, no Vekstor account for this email yet**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│            [ Vekstor mark ]                      │
│                                                  │
│      Sebastian inviterer deg til                 │
│            Occasione                             │
│                                                  │
│      Du får rollen: admin                        │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ E-post                                     │  │
│  │ [sebastian.p.skar@gmail.com]  🔒 (låst)    │  │
│  │                                            │  │
│  │ Velg et passord (min. 10 tegn)             │  │
│  │ [________________________]  [Vis]          │  │
│  │                                            │  │
│  │ [      Opprett konto og bli med       →  ] │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Invitasjonen utløper 29. apr. 2026              │
└──────────────────────────────────────────────────┘
```

Email is **locked to the invited address** — closes security finding #1.

**State B — Not signed in, but a Vekstor account with this email exists**
Shows: *"Du har allerede en Vekstor-konto på denne e-posten. Logg inn
for å akseptere."* with an inline login form (email pre-filled, locked).

**State C — Signed in as the invited email**
Shows the invite metadata (workspace name, role, inviter, expiry) and a
single *"Aksepter invitasjon"* Ink button. On success → switch active
org → toast → `/dashboard`.

**State D — Signed in as someone else**
Shows a warning card: *"Du er innlogget som larsje@gmail.com, men
invitasjonen er til sebastian.p.skar@gmail.com."* Two buttons:
*"Logg ut og aksepter som Sebastian"* and *"Avbryt"*. Prevents
accidentally joining the wrong org.

---

## What the server enforces (belt + suspenders)

Better Auth's `organization` plugin does most of this natively, but we
verify server-side in case the client is bypassed:

- **Invitation email match**: `authClient.organization.acceptInvitation`
  verifies the invited email equals the signed-in user's email. Rejects
  otherwise with `wrong_email`.
- **Invitation expiry**: 14 days, enforced by the trigger query.
- **Invitation single-use**: `status` transitions `pending → accepted`
  atomically; reuse returns `already_accepted`.
- **Rate limiting**: Better Auth's built-in limiter on `/sign-in`,
  `/sign-up`, `/forget-password` (5/min per IP by default).
- **Email verification required**: protected routes reject unverified
  sessions.

---

## /design-critique

### Overall Impression
Unified login/signup/magic-link on a single page keeps cognitive load
low — the user never wonders which screen they're on. Invitation page
adapting to four identity states closes the account-hijack attack
surface without asking the user to think. First-reaction emotional
beat is *"this is a serious tool that expects me to know who I am"*
— correct for B2B.

### Usability

| Finding | Severity | Recommendation |
|---|---|---|
| Forgot-password is a modal instead of a route — preserves context | 🟢 positive | keep |
| Magic link below the form instead of above — lets password users hit submit without scanning past alternatives | 🟢 positive | keep |
| Signup collects only email + password — company/name moved to onboarding | 🟢 positive | A/B vs "ask company up front" in session 3; first-time completion likely wins |
| Verification banner replaces page redirect after signup | 🟡 moderate | Users may still click away before verifying. Follow up with a resend-link CTA after 30 s idle. |
| Invite State D ("signed in as wrong user") could be missed if banner is quiet | 🟡 moderate | Use Rose `#E8CEC8` tint card + warning icon; force a click before revealing accept action |

### Visual Hierarchy

- **First fixation**: Vekstor wordmark (correct — establishes identity)
- **Second**: mono eyebrow `GROWTH INTELLIGENCE · NORGE` (correct)
- **Third**: tab switcher (correct — decision point)
- **Fourth**: email field (correct — the natural start of the form)
- **Primary action visually weighted**: Ink CTA button, full-width,
  `Prøv gratis i 14 dager`-style. Magic-link button below uses the
  border-only treatment so it doesn't compete.
- Invite page's **workspace name** (Occasione) is the typographic hero —
  Work Sans Bold, large. Everything else is support.

### Consistency

| Element | Status |
|---|---|
| Typography | Work Sans Bold headers, Outfit body, Geist Mono labels — matches the app |
| Color | Canvas ground, Ink CTA, Sage inflection on positive states, Rose tint on warnings |
| Spacing | Card padding `p-8`, input height `py-2.5`, button `py-3` — matches existing Settings page |
| Icons | lucide-react, 15–18px, stroke = ink-muted on idle, ink on hover |
| Error states | Same `[#C83A2E]` red as the current sign-out button in Sidebar — brand-consistent |

### Accessibility

- Labels use `<label htmlFor=…>` tied to input IDs (screen readers read
  field name on focus)
- Password field has visible toggle with `aria-label="Vis passord"`
- Error messages rendered inline under fields with `role="alert"`
- Focus ring: 2 px `sage-bright/30` — AA contrast against Canvas
- Touch targets ≥ 44 × 44 px on mobile — already true in current design
- Invite State D uses both color + icon + text so the warning doesn't
  rely on color alone (colorblind-safe)

### What works well
- Single login/signup card reduces surface area vs. the split login+signup pages common elsewhere
- Invite email-lock is implemented in the UI AND in the server RPC —
  two defenses
- Magic-link as an escape hatch for users who forgot their password but
  still want to sign in in the next 10 minutes
- Verification banner instead of redirect lets the user see which email
  the link went to without losing context
- Onboarding is decoupled from signup — fewer abandoned signups

### Priority Recommendations
1. **Ship State D's warning as a Rose-tinted card with explicit "Logg
   ut og aksepter som X"** — the most common footgun in multi-account
   households/shared laptops is clicking an invite while signed in as
   a different user.
2. **Render the workspace name as the largest typographic element** on
   the invite page — it's the emotional payload that makes the user
   trust the flow.
3. **Debounce the password strength meter** to avoid layout thrash
   while typing — the score should update every 100 ms, not every
   keystroke.
4. **Prefetch `authClient.getSession()`** on `/invite/:token` so the
   identity-state branch resolves before the page paints — otherwise
   users see a flicker from State A → State C.

---

## When to revisit this doc

After Session 4 lands. Real user feedback on password vs. magic-link
preferences will tell us whether magic-link should be promoted above
the password form (B2B Norwegian trades users may prefer it).
