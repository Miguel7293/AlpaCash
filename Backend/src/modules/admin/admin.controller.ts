import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  listUsers,
  getUser,
  updateEstado,
} from "./admin.service";

export async function listUsersHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const estado = req.query.estado as string | undefined;
    const result = await listUsers(estado ? { estado } : undefined);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return res.status(500).json({ message });
  }
}

export async function getUserHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const id = req.params["id"] as string;
    const result = await getUser(id);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message === "Usuario no encontrado" ? 404 : 500;
    return res.status(status).json({ message });
  }
}

export async function updateEstadoHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const id = req.params["id"] as string;
    const { estado } = req.body as { estado?: string };

    if (!estado || typeof estado !== "string") {
      return res.status(400).json({ message: "El campo 'estado' es requerido" });
    }

    const result = await updateEstado(id, estado);

    if ("transitionError" in result) {
      const { type, current, requested } = result.transitionError;

      if (type === "not_found") {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      return res.status(422).json({
        message: `Transición de estado inválida: ${current} → ${requested}`,
        current,
        requested,
      });
    }

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return res.status(500).json({ message });
  }
}
