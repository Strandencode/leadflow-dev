# LeadFlow — Stripe Betalingsintegrasjon

## Oversikt

For å ta betalt trenger vi:
1. **Stripe-konto** (gratis å opprette)
2. **Stripe Checkout** — en ferdig betalingsside fra Stripe (ingen koding av betalingsform)
3. **Stripe Customer Portal** — lar kunder administrere abonnementet selv
4. **Webhooks** (valgfritt til å begynne med) — for automatisk oppgradering i appen

## Steg 1: Opprett Stripe-konto

1. Gå til https://dashboard.stripe.com/register
2. Opprett konto med e-posten din
3. Verifiser bedriften din (kan gjøres senere, men nødvendig for å ta ekte betalinger)

## Steg 2: Opprett produkter og priser

I Stripe Dashboard → **Products** → **Add product**:

### Produkt 1: LeadFlow Starter
- Navn: `LeadFlow Starter`
- Pris: `49 NOK` / måned (recurring)
- Beskrivelse: `1 000 e-poster og 1 000 telefonnumre per måned`
- Etter opprettelse: kopier **Price ID** (starter med `price_...`)

### Produkt 2: LeadFlow Unlimited
- Navn: `LeadFlow Unlimited`
- Pris: `149 NOK` / måned (recurring)
- Beskrivelse: `Alt ubegrenset`
- Etter opprettelse: kopier **Price ID**

## Steg 3: Legg til Stripe-nøkler i .env

Gå til Stripe Dashboard → **Developers** → **API keys**

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...din-nøkkel-her
VITE_STRIPE_STARTER_PRICE_ID=price_...starter-price-id
VITE_STRIPE_UNLIMITED_PRICE_ID=price_...unlimited-price-id
```

## Steg 4: Stripe Checkout (frontend-only)

Den enkleste løsningen er **Stripe Payment Links**. Du trenger ingen backend.

### Alternativ A: Payment Links (enklest)
1. Gå til Stripe → **Payment Links** → **Create payment link**
2. Velg produktet (Starter eller Unlimited)
3. Aktiver "Collect customer email"
4. Du får en URL som `https://buy.stripe.com/...`
5. Legg denne URL-en rett i appen som oppgraderingslenke

### Alternativ B: Stripe Checkout via JS (litt mer jobb)
Krever en enkel Vercel Edge Function (serverless) for å opprette checkout sessions.

## Steg 5: Kundeportal

I Stripe → **Settings** → **Billing** → **Customer portal**:
1. Aktiver kundeportalen
2. Velg hva kunder kan gjøre (endre plan, avbryte, oppdatere betalingsmetode)
3. Du får en portal-lenke du kan bruke som "Administrer"-knappen i appen

---

## For raskest mulig lansering

Bruk **Payment Links** (Alternativ A). Du trenger:

1. Opprett de to produktene i Stripe
2. Lag en Payment Link for hvert produkt  
3. Lim lenkene inn i appen (erstatt `handleSelectPlan` i SettingsPage)
4. Følg opp manuelt hvem som betaler i Stripe Dashboard

Det tar ca. 10 minutter å sette opp, og du kan begynne å ta betalt i dag.

## Neste steg (når du har flere kunder)

1. **Vercel Edge Functions** for å opprette Checkout Sessions med kundens e-post
2. **Webhooks** for automatisk plan-oppgradering i Supabase når betaling mottas
3. **Stripe Customer Portal** lenket fra "Administrer"-knappen
