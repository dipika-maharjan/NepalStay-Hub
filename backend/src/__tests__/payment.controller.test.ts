import crypto from "crypto";
import {
  buildEsewaSignature,
  resolvePaymentProvider,
} from "../controllers/payment.controller";

describe("payment provider initialization", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("falls back to an eSewa-style flow when Stripe is not configured", () => {
    const provider = resolvePaymentProvider();

    expect(provider.provider).toBe("esewa");
    expect(provider.configured).toBe(false);
    expect(provider.client).toBeNull();
  });

  it("builds a valid eSewa signature from the signed fields", () => {
    const signature = buildEsewaSignature({
      total_amount: "100.00",
      transaction_uuid: "txn-123",
      product_code: "EPAYTEST",
      secret_key: "test-secret",
    });

    const expected = crypto
      .createHmac("sha256", "test-secret")
      .update(
        "total_amount=100.00,transaction_uuid=txn-123,product_code=EPAYTEST",
      )
      .digest("base64");

    expect(signature).toBe(expected);
  });
});
