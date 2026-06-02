import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfesorCard from "@/components/profesores/ProfesorCard";
import { Heart } from "lucide-react";

export const metadata = { title: "Mis Favoritos — ProfeLink" };

export default async function FavoritosPage() {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") redirect("/login");

  const favoritos = await prisma.favorito.findMany({
    where: { estudianteId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      profesor: {
        include: {
          usuario: { select: { nombre: true } },
          especialidades: { select: { materia: true } },
        },
      },
    },
  });

  const profesores = favoritos.map(f => ({
    id: f.profesor.id,
    usuarioId: f.profesor.usuarioId,
    nombre: f.profesor.usuario.nombre,
    fotoUrl: f.profesor.fotoUrl,
    bio: f.profesor.bio,
    nivel: f.profesor.nivel,
    precioHora: Number(f.profesor.precioHora),
    aceptaPrimeraGratis: f.profesor.aceptaPrimeraGratis,
    nivelVerificacion: f.profesor.nivelVerificacion,
    modalidad: f.profesor.modalidad,
    estado: f.profesor.estado,
    ratingPromedio: Number(f.profesor.ratingPromedio),
    totalResenas: f.profesor.totalResenas,
    especialidades: f.profesor.especialidades.map(e => e.materia),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Heart className="w-6 h-6 fill-red-500 text-red-500" /> Mis Favoritos
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tutores que guardaste para reservar después</p>
      </div>

      {profesores.length === 0 ? (
        <div className="bento p-10 text-center elev-1">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-heading font-semibold text-gray-500">Aún no tienes favoritos</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Pulsa el corazón en cualquier tutor para guardarlo aquí</p>
          <Link href="/profesores"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl">
            Buscar tutores
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profesores.map(p => (
            <ProfesorCard key={p.id} profesor={p} />
          ))}
        </div>
      )}
    </div>
  );
}
