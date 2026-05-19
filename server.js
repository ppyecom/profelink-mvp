// Servidor personalizado Next.js + Socket.io
// Ejecutar con: node server.js  (en vez de next dev)
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const cookieLib = require("cookie");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
    path: "/api/socket",
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = cookieLib.parse(cookieHeader);
      const token = cookies.profelink_token;
      if (!token) return next(new Error("Sin token"));

      // Verificar JWT con jose (ESM → dynamic import)
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "fallback_secret_change_in_production"
      );
      const { payload } = await jwtVerify(token, secret);
      socket.data.user = payload; // { sub, email, nombre, rol }
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`[WS] conectado: ${user.nombre} (${user.rol})`);

    // Unirse a la sala de una sesión
    socket.on("join_sesion", async (sesionId) => {
      const sesion = await prisma.sesion.findUnique({
        where: { id: sesionId },
        include: { profesor: { select: { usuarioId: true } } },
      });
      if (!sesion) return;

      const ok =
        sesion.estudianteId === user.sub ||
        sesion.profesor.usuarioId === user.sub ||
        user.rol === "ADMIN";
      if (!ok) return;

      socket.join(`sesion:${sesionId}`);
      console.log(`[WS] ${user.nombre} → sala sesion:${sesionId}`);
    });

    socket.on("leave_sesion", (sesionId) => {
      socket.leave(`sesion:${sesionId}`);
    });

    // Enviar mensaje
    socket.on("send_message", async ({ sesionId, contenido }) => {
      if (!contenido?.trim() || contenido.length > 1000) return;

      const sesion = await prisma.sesion.findUnique({
        where: { id: sesionId },
        include: { profesor: { select: { usuarioId: true } } },
      });
      if (!sesion) return;

      const esParticipante =
        sesion.estudianteId === user.sub ||
        sesion.profesor.usuarioId === user.sub;
      if (!esParticipante) return;

      const mensaje = await prisma.mensaje.create({
        data: { sesionId, remitenteId: user.sub, contenido: contenido.trim() },
        include: { remitente: { select: { nombre: true, rol: true } } },
      });

      const payload = {
        id: mensaje.id,
        contenido: mensaje.contenido,
        remitenteId: mensaje.remitenteId,
        remitente: mensaje.remitente.nombre,
        createdAt: mensaje.createdAt.toISOString(),
      };

      // Al remitente con esPropio: true
      socket.emit("mensaje", { ...payload, esPropio: true });
      // Al resto de la sala con esPropio: false
      socket.to(`sesion:${sesionId}`).emit("mensaje", { ...payload, esPropio: false });
    });

    // Marcar mensajes como leídos
    socket.on("mark_read", async (sesionId) => {
      await prisma.mensaje.updateMany({
        where: { sesionId, remitenteId: { not: user.sub }, leido: false },
        data: { leido: true },
      });
      // Notificar al otro usuario que sus mensajes fueron leídos
      socket.to(`sesion:${sesionId}`).emit("mensajes_leidos", sesionId);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] desconectado: ${user.nombre}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`\n▲ ProfeLink corriendo en http://localhost:${PORT}`);
    console.log("  Socket.io activo en /api/socket\n");
  });
});
