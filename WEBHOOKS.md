# Webhooks Integration

This document explains how to manually test the Svix/Resend webhook signature verification process implemented in our PocketBase hooks.

## Signature Protocol

The verification follows the Svix specification used by Resend:

1. The payload to sign is constructed as `${id}.${timestamp}.${raw_body}`
2. The secret key (if prefixed with `whsec_`) is base64-decoded into raw bytes.
3. An HMAC-SHA256 hash is computed and base64-encoded.
4. The generated signature is compared against the headers using a constant-time comparison to prevent timing attacks.

## Environment Variables

Ensure the following variable is present in your `.env`:
`RESEND_WEBHOOK_SECRET=whsec_your_base64_secret_here`

## Manual Testing via cURL

To test the webhook locally or against a deployed instance, you need to generate a valid signature. The timestamp must be within 5 minutes of the server's current time.

### 1. Generate Signature (Node.js Example)

```javascript
const crypto = require('crypto')

const secret = 'whsec_testsecretkey...'
const body = '{"type":"email.delivered","data":{}}'
const id = 'evt_test_123'
const timestamp = Math.floor(Date.now() / 1000).toString()

// Construct payload
const signedPayload = `${id}.${timestamp}.${body}`

// Decode secret
const secretBytes = Buffer.from(secret.split('_')[1], 'base64')

// Calculate HMAC
const hmac = crypto.createHmac('sha256', secretBytes)
hmac.update(signedPayload)
const signature = hmac.digest('base64')

console.log(`svix-id: ${id}`)
console.log(`svix-timestamp: ${timestamp}`)
console.log(`svix-signature: v1,${signature}`)
```

### 2. Send the Request

Since our implementation captures the exact raw body to avoid JSON formatting issues, you can simulate a request manually:

```bash
curl -X POST https://your-pocketbase-instance.com/backend/v1/webhook/resend \
  -H "Content-Type: application/json" \
  -H "svix-id: evt_test_123" \
  -H "svix-timestamp: 1690000000" \
  -H "svix-signature: v1,YOUR_GENERATED_SIGNATURE" \
  -H "x-raw-body: {\"type\":\"email.delivered\",\"data\":{}}" \
  -d '{"type":"email.delivered","data":{}}'
```

_Note: In the development/Skip Cloud environment, if `e.requestInfo().rawBody` is not directly exposed, the hook will look for the `x-raw-body` header as a fallback to bypass `JSON.stringify` serialization differences._
