# Navnirman Backend


## v0.7.1 – Razorpay webhook reliability

- The webhook endpoint validates `X-Razorpay-Signature` against the exact raw request body using `RAZORPAY_WEBHOOK_SECRET`.
- It requires Razorpay's `X-Razorpay-Event-Id` header and records each event in `razorpay_webhook_events`.
- Event IDs are inserted with MySQL `INSERT IGNORE`, so duplicate and concurrent deliveries of the same event ID are acknowledged without processing twice.
- `payment.captured` is checked against the stored order ID, amount, currency, and captured status before activating the subscription.
- `payment.failed` cannot change an already-paid order to failed.
- Unsupported but validly signed events are recorded as ignored and acknowledged with HTTP 200.
- Event recording and payment/subscription updates run in one transaction. If processing fails, the transaction rolls back so Razorpay can retry.

### Razorpay webhook configuration

Configure the webhook URL as `https://<your-public-host>/api/payments/webhook` (for local testing, expose the local backend through a secure HTTPS tunnel). Subscribe to `payment.captured` and `payment.failed`. Configure the same webhook secret in the Razorpay dashboard and the backend environment variable `RAZORPAY_WEBHOOK_SECRET`.

Do not use the API key secret as the webhook secret unless you intentionally configured both values to be identical. Never commit either secret.
