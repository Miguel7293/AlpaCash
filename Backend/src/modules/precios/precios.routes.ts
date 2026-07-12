import { Router } from "express";
import { getPrecios } from "./precios.controller";

const router = Router();

// GET /api/precios  →  public price summaries per fiber category
router.get("/", getPrecios);

export default router;
