import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import authRoutes from "../routes/authRoutes.js";
import User from "../models/userModel.js";
import { googleClient } from "../services/googleAuth.js";
import { startMongo } from "./helpers/mongo.js";

process.env.JWT_SECRET = "isolated-auth-test-secret-never-for-production";
process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
const signup = { name: "Test User", email: "user@example.com", password: "valid-password-42" };
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const originalCerts = googleClient.getFederatedSignonCertsAsync;
let stop;
before(async () => {
  stop = await startMongo(27187);
  await User.init();
  // Only Google's public-key fetch is stubbed; verifyIdToken still verifies the signed JWT.
  googleClient.getFederatedSignonCertsAsync = async () => ({ certs: { test: publicKey.export({ type: "spki", format: "pem" }) }, format: "PEM" });
});
after(async () => { googleClient.getFederatedSignonCertsAsync = originalCerts; if (stop) await stop(); });
beforeEach(async () => { await User.deleteMany({}); });
function credential(overrides = {}) {
  return jwt.sign({ iss: "https://accounts.google.com", aud: process.env.GOOGLE_CLIENT_ID, sub: "google-user-123", email: "google@example.com", email_verified: true, name: "Google User", ...overrides }, privateKey, { algorithm: "RS256", keyid: "test", expiresIn: "1h" });
}
function google(token = credential(), extra = {}) { return request(app).post("/auth/google").send({ credential: token, ...extra }); }

test("registration normalizes input, hashes passwords, returns a safe JWT session and persists /me", async () => {
  const res = await request(app).post("/auth/register").send({ ...signup, name: " Test User ", email: " USER@example.com ", role: "admin" }).expect(201);
  assert.deepEqual(Object.keys(res.body.user).sort(), ["email", "id", "name", "role"]);
  assert.equal(res.body.user.role, "general");
  assert.equal(res.body.user.email, signup.email);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).sub, res.body.user.id);
  const stored = await User.findById(res.body.user.id).select("+passwordHash");
  assert.notEqual(stored.passwordHash, signup.password);
  assert.ok(await bcrypt.compare(signup.password, stored.passwordHash));
  const me = await request(app).get("/auth/me").set("Authorization", `Bearer ${res.body.token}`).expect(200);
  assert.deepEqual(me.body.user, res.body.user);
});

test("registration rejects malformed inputs, duplicate email and duplicate signup races", async () => {
  for (const changes of [{ name: "  " }, { name: {} }, { email: [] }, { email: "invalid" }, { password: {} }, { password: "short" }, { password: "😀".repeat(19) }]) {
    await request(app).post("/auth/register").send({ ...signup, ...changes }).expect(400);
  }
  const results = await Promise.all([1, 2].map(() => request(app).post("/auth/register").send(signup)));
  assert.deepEqual(results.map((res) => res.status).sort(), [201, 409]);
  await request(app).post("/auth/register").send({ ...signup, email: "USER@example.com" }).expect(409);
});

test("password login accepts valid credentials and rejects wrong, absent and inactive accounts", async () => {
  await request(app).post("/auth/register").send(signup).expect(201);
  const login = await request(app).post("/auth/login").send({ ...signup, email: "USER@example.com" }).expect(200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.passwordHash, undefined);
  for (const changes of [{ password: "wrong" }, { email: "missing@example.com" }]) {
    await request(app).post("/auth/login").send({ ...signup, ...changes }).expect(401);
  }
  await request(app).post("/auth/login").send({ email: {}, password: [] }).expect(400);
  await User.updateOne({ email: signup.email }, { isActive: false });
  await request(app).post("/auth/login").send(signup).expect(401);
  await request(app).get("/auth/me").set("Authorization", `Bearer ${login.body.token}`).expect(401);
});

test("protected API rejects missing, tampered, expired and deleted-user sessions", async () => {
  await request(app).get("/auth/me").expect(401);
  await request(app).get("/auth/me").set("Authorization", "Bearer invalid").expect(401);
  const registration = await request(app).post("/auth/register").send(signup);
  const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: registration.body.user.id, expiresIn: -1 });
  await request(app).get("/auth/me").set("Authorization", `Bearer ${expired}`).expect(401);
  await User.deleteMany({});
  await request(app).get("/auth/me").set("Authorization", `Bearer ${registration.body.token}`).expect(401);
});

test("Google verifies signed credential, ignores browser identity, and finds subsequent logins by sub", async () => {
  const first = await google(credential(), { email: "attacker@example.com", sub: "attacker", role: "admin" }).expect(200);
  assert.equal(first.body.user.email, "google@example.com");
  assert.equal(first.body.user.role, "general");
  assert.equal(first.body.user.googleSub, undefined);
  assert.equal(jwt.verify(first.body.token, process.env.JWT_SECRET).sub, first.body.user.id);
  await request(app).get("/auth/me").set("Authorization", `Bearer ${first.body.token}`).expect(200);
  const second = await google(credential({ email: "changed@example.com" })).expect(200);
  assert.equal(second.body.user.id, first.body.user.id);
  assert.equal(await User.countDocuments(), 1);
  await request(app).post("/auth/login").send({ email: "google@example.com", password: "any-password" }).expect(401);
  await User.updateOne({ _id: first.body.user.id }, { isActive: false });
  await google().expect(401);
});

test("Google rejects bad signature, audience, issuer, expiration and unverified email", async () => {
  for (const payload of [{ aud: "wrong-client" }, { iss: "https://attacker.example" }, { email_verified: false }, { sub: "" }, { email: "invalid" }, { iat: 1 }]) {
    await google(credential(payload)).expect(401);
  }
  const expired = jwt.sign({ sub: "123", aud: process.env.GOOGLE_CLIENT_ID, iss: "https://accounts.google.com", iat: 1, exp: 2 }, privateKey, { algorithm: "RS256", keyid: "test" });
  await google(expired).expect(401);
  await google(`${credential().split(".").slice(0, 2).join(".")}.bad`).expect(401);
  await google("not-a-jwt").expect(401);
  await request(app).post("/auth/google").send({ email: "google@example.com" }).expect(400);
  assert.equal(await User.countDocuments(), 0);
});

test("Google never silently links a password account or another Google sub with matching email", async () => {
  await request(app).post("/auth/register").send(signup).expect(201);
  await google(credential({ email: signup.email })).expect(409);
  assert.equal((await User.findOne({ email: signup.email }).select("+googleSub")).googleSub, undefined);
  await request(app).post("/auth/login").send(signup).expect(200);
  await google().expect(200);
  await google(credential({ sub: "different-google-user" })).expect(409);
});

test("Google returns a clear configuration error without a web client ID", async () => {
  const previous = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  try { await google("test").expect(503); } finally { process.env.GOOGLE_CLIENT_ID = previous; }
});
