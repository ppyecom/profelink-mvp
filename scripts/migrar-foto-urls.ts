// Migra fotoUrl viejas (/uploads/profesores/...) al nuevo formato (/api/uploads/profesores/...)
// Uso: npx tsx scripts/migrar-foto-urls.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const perfiles = await prisma.perfilProfesor.findMany({
    where: { fotoUrl: { startsWith: "/uploads/profesores/" } },
    select: { id: true, fotoUrl: true },
  });

  console.log(`Encontrados ${perfiles.length} perfiles a migrar`);

  for (const p of perfiles) {
    const nuevaUrl = p.fotoUrl!.replace("/uploads/profesores/", "/api/uploads/profesores/");
    await prisma.perfilProfesor.update({
      where: { id: p.id },
      data: { fotoUrl: nuevaUrl },
    });
    console.log(`  ${p.fotoUrl} → ${nuevaUrl}`);
  }

  console.log("Listo.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
