import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { register, login, me } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
