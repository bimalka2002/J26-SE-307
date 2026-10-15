import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { verifyGoogleCredential } from "../services/googleAuth.js";

const PUBLIC_ROLES = ["general", "clinical"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const validEmail = (value) => value.length <= 254 && EMAIL.test(value);
// bcrypt only considers the first 72 bytes; reject instead of silently truncating.
const validPassword = (value) => typeof value === "string" && value.length >= 8 && Buffer.byteLength(value, "utf8") <= 72;

function signToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function session(user) {
  return { token: signToken(user), user: publicUser(user) };
}

export async function register(req, res) {
  try {
    const { name, email: inputEmail, password, role } = req.body || {};
    const email = normalizeEmail(inputEmail);
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || !validEmail(email)) {
      return res.status(400).json({ message: "Enter a name (1–100 characters) and a valid email address" });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and at most 72 UTF-8 bytes" });
    }
    const existing = await userModel.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered. Sign in with your existing account." });

    const user = await userModel.create({
      name: name.trim(), email,
      passwordHash: await bcrypt.hash(password, 10),
      // Admin is never self-assignable.
      role: PUBLIC_ROLES.includes(role) ? role : "general",
    });
    return res.status(201).json(session(user));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email already registered" });
    console.error("register error:", err.message);
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
}

export async function login(req, res) {
  try {
    const { email: inputEmail, password } = req.body || {};
    const email = normalizeEmail(inputEmail);
    if (!validEmail(email) || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Enter a valid email address and password" });
    }
    const user = await userModel.findOne({ email }).select("+passwordHash");
    if (!user || !user.isActive || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    return res.json(session(user));
  } catch (err) {
    console.error("login error:", err.message);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
}

export async function googleLogin(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: "Google sign-in is not configured yet. Please use email and password." });
  }
  const { credential } = req.body || {};
  if (typeof credential !== "string" || !credential || credential.length > 16384) {
    return res.status(400).json({ message: "A Google sign-in credential is required" });
  }
  let payload;
  try {
    // Checks Google's signature, audience, issuer, and expiration on the server.
    payload = await verifyGoogleCredential(credential);
    if (!payload?.sub || payload.email_verified !== true || !validEmail(normalizeEmail(payload.email))) {
      throw new Error("Missing verified Google identity");
    }
  } catch {
    return res.status(401).json({ message: "Google sign-in could not be verified. Please try again." });
  }
  try {
    let user = await userModel.findOne({ googleSub: payload.sub });
    if (!user) {
      const email = normalizeEmail(payload.email);
      if (await userModel.exists({ email })) {
        return res.status(409).json({ message: "An account already uses this email. Sign in using its original method. Google accounts are not linked automatically." });
      }
      user = await userModel.create({
        googleSub: payload.sub,
        email,
        name: (typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0]).slice(0, 100),
        role: "general",
      });
    }
    if (!user.isActive) return res.status(401).json({ message: "User not found or inactive" });
    return res.json(session(user));
  } catch (err) {
    // Concurrent signup must never bypass unique provider/email constraints.
    if (err.code === 11000) return res.status(409).json({ message: "Account already exists. Please sign in again using its original method." });
    console.error("google login error:", err.message);
    return res.status(500).json({ message: "Google sign-in failed. Please try again." });
  }
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}
