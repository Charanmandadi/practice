const express = require('express');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const port = Number(process.env.PORT || 4242);
const clientUrl = process.env.CLIENT_URL || `http://localhost:${port}`;

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in environment');
}
if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing STRIPE_PUBLISHABLE_KEY in environment');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_xxx', {
  apiVersion: '2024-06-20',
});

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Root index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// JSON for normal routes, raw body for webhooks
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_xxx' });
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Pro Subscription' },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/public/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/public/cancel.html`,
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!sig || !webhookSecret) {
      throw new Error('Missing Stripe signature or webhook secret');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Checkout completed:', session.id);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});