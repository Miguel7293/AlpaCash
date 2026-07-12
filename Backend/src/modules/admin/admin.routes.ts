import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  listUsersHandler,
  getUserHandler,
  updateEstadoHandler,
} from "./admin.controller";

const router = Router();

router.get("/users", authMiddleware, requireRole("admin"), listUsersHandler);
router.get("/users/:id", authMiddleware, requireRole("admin"), getUserHandler);
router.patch(
  "/users/:id/estado",
  authMiddleware,
  requireRole("admin"),
  updateEstadoHandler
);

export default router;
