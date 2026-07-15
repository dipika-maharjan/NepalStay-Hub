import { Request, Response } from "express";
import Stripe from "stripe";
import { PaymentModel } from "../models/payment.model";
import { BookingModel } from "../models/booking.model";
import { AuditLogModel } from "../models/auditLog.model";
import { AuthRequest } from "../middleware/auth.middleware";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// POST /api/payments/create-intent
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { bookingId } = req.body;
    const travelerId = authReq.user?.userId;

    if (!bookingId) {
      res.status(400).json({ message: "Booking ID is required" });
      return;
    }

    const booking = await BookingModel.findOne({ _id: bookingId, userId: travelerId });
    if (!booking) {
      res.status(404).json({ message: "Booking not found or access denied" });
      return;
    }

    if ((booking as any).paymentStatus === "paid") {
      res.status(400).json({ message: "Booking already paid" });
      return;
    }

    const amountInCents = Math.round((booking as any).totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        bookingId: bookingId,
        travelerId: travelerId!,
      },
    });

    const payment = await PaymentModel.create({
      bookingId,
      travelerId,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      amount: (booking as any).totalPrice,
      currency: "usd",
      status: "pending",
    });

    (booking as any).paymentId = payment._id;
    await (booking as any).save();

    await AuditLogModel.create({
      userId: travelerId,
      action: "PAYMENT_INITIATED",
      targetType: "Payment",
      targetId: payment._id.toString(),
      ipAddress: req.ip || "unknown",
      metadata: { bookingId, amount: (booking as any).totalPrice },
      timestamp: new Date(),
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

// POST /api/payments/webhook — Stripe webhook
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    // req.body must be the raw body
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    res.status(400).json({ message: "Webhook signature verification failed" });
    return;
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const { bookingId } = intent.metadata as any;

      await PaymentModel.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          status: "succeeded",
          stripeClientSecret: null,
          paidAt: new Date(),
        }
      );

      await BookingModel.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        bookingStatus: "confirmed",
      });

      await AuditLogModel.create({
        userId: null,
        action: "PAYMENT_SUCCESS",
        targetType: "Booking",
        targetId: bookingId,
        ipAddress: "stripe-webhook",
        metadata: { stripeIntentId: intent.id },
        timestamp: new Date(),
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;

      await PaymentModel.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: "failed" }
      );

      await AuditLogModel.create({
        userId: null,
        action: "PAYMENT_FAILED",
        targetType: "Payment",
        targetId: intent.id,
        ipAddress: "stripe-webhook",
        metadata: { reason: (intent.last_payment_error as any)?.message },
        timestamp: new Date(),
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

// GET /api/payments/booking/:bookingId
export const getPaymentByBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const travelerId = authReq.user?.userId;

    const booking = await BookingModel.findOne({
      _id: req.params.bookingId,
      userId: travelerId,
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found or access denied" });
      return;
    }

    const payment = await PaymentModel.findOne({
      bookingId: req.params.bookingId,
    });

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json({ payment });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};
