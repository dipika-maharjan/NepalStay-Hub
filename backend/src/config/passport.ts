import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel, IUser } from "../models/user.model";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({
          $or: [{ googleId: profile.id }, { email: profile._json.email }],
        });

        if (existingUser) {
          // If user exists but doesn't have googleId (signed up with local strategy)
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            existingUser.authProvider = "google";
            existingUser.isEmailVerified = true;
            await existingUser.save();
          }
          return done(null, {
            userId: existingUser._id.toString(),
            role: existingUser.role,
            uuid: existingUser.uuid,
          });
        }

        // Create new user
        const newUser = await UserModel.create({
          name: profile.displayName,
          email: profile._json.email,
          authProvider: "google",
          googleId: profile.id,
          isEmailVerified: true, // Google emails are already verified
          role: "traveler",
        });

        return done(null, {
          userId: newUser._id.toString(),
          role: newUser.role,
          uuid: newUser.uuid,
        });
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

// We won't use session-based serialization since we use JWTs, but passport might require these
passport.serializeUser((user: Express.User, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    if (!user) return done(null, false);
    done(null, {
      userId: user._id.toString(),
      role: user.role,
      uuid: user.uuid,
    });
  } catch (error) {
    done(error, null);
  }
});

export default passport;
