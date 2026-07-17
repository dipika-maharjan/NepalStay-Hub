import { resolvePaymentProvider } from "../controllers/payment.controller";

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
});
