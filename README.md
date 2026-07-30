# NepalStay Hub

NepalStay Hub is a comprehensive full-stack hotel and accommodation booking platform built specifically to manage and reserve stays in Nepal. It offers a seamless experience for both travelers looking for accommodations and administrators managing the platform.

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State & Form Management**: React Hook Form, Zod (Schema Validation)
- **Maps**: React Leaflet
- **Authentication**: JWT, `js-cookie`, custom AuthContext
- **Icons**: Lucide React

### Backend
- **Environment**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Language**: TypeScript
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose
- **Authentication**: JWT (JSON Web Tokens), Passport.js (Google OAuth 2.0), `otplib` (Multi-Factor Authentication)
- **Payments**: [Stripe](https://stripe.com/)
- **Security**: 
  - `helmet` (HTTP header security)
  - `express-rate-limit` (Rate limiting & IP blocking)
  - `express-mongo-sanitize` (NoSQL injection prevention)
  - Custom XSS and SSRF protection middlewares
- **Logging**: Winston (File & MongoDB transports)

## ✨ Key Features

- **Robust Authentication**: Standard email/password login, Google OAuth integration, and Two-Factor Authentication (2FA) for enhanced security.
- **Accommodation & Booking Management**: Browse stays, view room types, add optional extras, and make secure bookings.
- **Secure Payments**: Integrated with Stripe for handling checkout securely.
- **Admin Dashboard**: Advanced admin controls for managing users, tracking audit logs, and managing IP blocks.
- **Interactive Maps**: Map-based property locations using Leaflet.
- **Reviews & Ratings**: Post-stay review system for verified users.

## 📦 Project Structure

The repository is structured as a monorepo containing two main directories:

- `/frontend` - The Next.js client application.
- `/backend` - The Node.js Express server.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally or a MongoDB Atlas connection URI.
- Stripe account (for payment processing).
- Google Cloud Console account (for Google OAuth credentials).

### 1. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```
Install dependencies:
```bash
npm install
```
Create a `.env` file in the `/backend` directory and configure the required variables (JWT Secret, MongoDB URI, Stripe Secret, Google OAuth credentials, etc.).

Start the development server:
```bash
npm run dev
```
The backend will run on `http://localhost:5051`.

### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Start the Next.js development server:
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:3000`.

## 🛡️ Security

Security is a primary focus of this platform. The backend includes dedicated middlewares to prevent common web vulnerabilities like XSS, SSRF, and NoSQL Injection. Additionally, rate limiting is aggressively configured to prevent brute force attacks on authentication routes.

## 📄 License
ISC
