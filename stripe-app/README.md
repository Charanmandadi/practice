# Stripe Checkout Integration (Express)

## Setup
1. Copy `.env.example` to `.env` and fill your keys:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:4242
PORT=4242
```

2. Install dependencies:
```
npm install
```

## Run
```
npm run start
```
Open `http://localhost:4242` and click Buy Now.

## Webhooks
Use the Stripe CLI to forward webhooks locally:
```
stripe listen --forward-to localhost:4242/webhook
```
Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in `.env`.