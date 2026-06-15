/**
 * Capa de abstracción de almacenamiento.
 *
 * Modo "local" (default): guarda en public/uploads/{carpeta}/<nombre>
 *   y se sirve por /api/uploads/{carpeta}/[name]
 *
 * Modo "gcs":  guarda en Google Cloud Storage y sirve signed URLs
 *
 * Selecciona el modo via env var STORAGE_DRIVER ("local" | "gcs").
 */

import { writeFile, mkdir, readFile, stat, unlink } from "fs/promises";
import path from "path";
import type { Storage } from "@google-cloud/storage";

type Carpeta = "profesores" | "credenciales" | "sesiones";

const DRIVER = (process.env.STORAGE_DRIVER ?? "local") as "local" | "gcs";
const GCS_BUCKET = process.env.GCS_BUCKET ?? "";

// Cliente perezoso (solo instanciamos si usamos GCS)
let gcsClient: Storage | null = null;
async function getGcs(): Promise<Storage> {
  if (!gcsClient) {
    const { Storage } = await import("@google-cloud/storage");
    gcsClient = new Storage();
  }
  return gcsClient;
}

export interface ArchivoSubido {
  publicPath: string; // ruta interna que guardamos en BD
  fileName:   string; // solo el nombre, sin path
}

/**
 * Sube un archivo. Devuelve la "publicPath" que debes guardar en BD.
 * - local: publicPath = /api/uploads/<carpeta>/<filename>
 * - gcs:   publicPath = gcs://<bucket>/<carpeta>/<filename>
 */
export async function subir(
  carpeta: Carpeta,
  fileName: string,
  buffer: Buffer,
  mime: string,
): Promise<ArchivoSubido> {
  if (DRIVER === "gcs") {
    const storage = await getGcs();
    const file = storage.bucket(GCS_BUCKET).file(`${carpeta}/${fileName}`);
    await file.save(buffer, { contentType: mime, resumable: false });
    return { publicPath: `gcs://${GCS_BUCKET}/${carpeta}/${fileName}`, fileName };
  }

  // Local
  const uploadDir = path.join(process.cwd(), "public", "uploads", carpeta);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);
  return { publicPath: `/api/uploads/${carpeta}/${fileName}`, fileName };
}

/**
 * Lee un archivo. En modo local devuelve buffer; en GCS devuelve buffer
 * (descargado) o lanza error si no existe.
 */
export async function leer(carpeta: Carpeta, fileName: string): Promise<Buffer> {
  if (DRIVER === "gcs") {
    const storage = await getGcs();
    const [buf] = await storage.bucket(GCS_BUCKET).file(`${carpeta}/${fileName}`).download();
    return buf;
  }

  const filePath = path.join(process.cwd(), "public", "uploads", carpeta, fileName);
  await stat(filePath);
  return readFile(filePath);
}

/**
 * Borra un archivo (silencioso si no existe).
 */
export async function borrar(carpeta: Carpeta, fileName: string): Promise<void> {
  if (DRIVER === "gcs") {
    const storage = await getGcs();
    await storage.bucket(GCS_BUCKET).file(`${carpeta}/${fileName}`).delete({ ignoreNotFound: true });
    return;
  }

  const filePath = path.join(process.cwd(), "public", "uploads", carpeta, fileName);
  await unlink(filePath).catch(() => null);
}

/**
 * Genera URL pública para mostrar/descargar el archivo.
 * - local: devuelve /api/uploads/...
 * - gcs:   devuelve una signed URL con expiración corta
 */
export async function urlPublica(
  publicPathOrFileName: string,
  carpeta?: Carpeta,
  expMin = 60,
): Promise<string> {
  if (DRIVER === "gcs") {
    // Soportamos tanto "gcs://bucket/carpeta/file" como "/api/uploads/carpeta/file" legacy
    let objectPath = "";
    if (publicPathOrFileName.startsWith("gcs://")) {
      objectPath = publicPathOrFileName.replace(`gcs://${GCS_BUCKET}/`, "");
    } else if (publicPathOrFileName.startsWith("/api/uploads/")) {
      objectPath = publicPathOrFileName.replace("/api/uploads/", "");
    } else if (carpeta) {
      objectPath = `${carpeta}/${publicPathOrFileName}`;
    } else {
      return publicPathOrFileName; // fallback
    }
    const storage = await getGcs();
    const [signed] = await storage
      .bucket(GCS_BUCKET)
      .file(objectPath)
      .getSignedUrl({ action: "read", expires: Date.now() + expMin * 60_000 });
    return signed;
  }

  // Local: ya viene como /api/uploads/...
  return publicPathOrFileName;
}

export const STORAGE_INFO = {
  driver: DRIVER,
  bucket: GCS_BUCKET || null,
};
