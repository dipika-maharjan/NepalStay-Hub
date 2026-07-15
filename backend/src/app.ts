import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth.route";
import mfaRoutes from "./routes/mfa.route";
import profileRoutes from "./routes/profile.route";
import accommodationRoutes from "./routes/accommodation.route";
import bookingRoutes from "./routes/booking.route";
import reviewRoutes from "./routes/review.route";
import paymentRoutes from "./routes/payment.route";
import hostVerificationRoutes from "./routes/hostVerification.route";
import roomTypeRoutes from "./routes/roomType.route";
import optionalExtraRoutes from "./routes/optionalExtra.route";
import { adminUserRoutes } from "./routes/admin/user.route";
import ipBlockRoutes from "./routes/admin/ipBlock.route";
import {
  generalRateLimiter,
  ipBlockMiddleware,
} from "./middleware/rateLimiter.middleware";
import {
  xssSanitizer,
  ssrfProtection,
  mongoSanitize,
} from "./middleware/security.middleware";
import logger from "./utils/logger.util";

const app: Application = express();

// ─── Stripe webhook — needs raw body, must be FIRST ───────────────────────
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// ─── Security headers via Helmet ──────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// ─── CORS — locked to frontend origin only ────────────────────────────────
const corsOptions = {
  origin: [process.env.CLIENT_URL || "http://localhost:3000"],
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────
app.use(
  express.json({
    type: (req) => {
      const contentType = (req.headers["content-type"] || "") as string;
      return !contentType.includes("multipart/form-data");
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// ─── Cookie parser ────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Security middleware stack ────────────────────────────────────────────
app.use(ipBlockMiddleware);
app.use(generalRateLimiter);
app.use(mongoSanitize()); // NoSQL injection prevention
app.use(xssSanitizer); // XSS input sanitization
app.use(ssrfProtection(["stripe.com", "googleapis.com"])); // SSRF protection

// Request logging — no sensitive data logged
app.use((req, _res, next) => {
  logger.info({
    action: "HTTP_REQUEST",
    metadata: {
      method: req.method,
      path: req.path,
      ip: req.ip,
    },
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/mfa", mfaRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/accommodations", accommodationRoutes);
app.use("/api/room-types", roomTypeRoutes);
app.use("/api/optional-extras", optionalExtraRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/host-verification", hostVerificationRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/ip-blocks", ipBlockRoutes);

// ─── Static files ─────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

export default app;
