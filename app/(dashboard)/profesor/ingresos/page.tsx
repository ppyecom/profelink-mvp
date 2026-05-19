import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSoles, calcularIngresoNeto, calcularComision, formatDate } from "@/lib/utils";

export const metadata = { title: "Ingresos — ProfeLink" };

export default async function IngresosPage() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") redirect("/login");

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) redirect("/login");

  const sesiones = await prisma.sesion.findMany({
    where: { profesorId: perfil.id, estado: "COMPLETADA" },
    orderBy: { fechaInicio: "desc" },
    include: { estudiante: { select: { nombre: true } } },
  });

  const totalBruto = sesiones.reduce((acc, s) => acc + Number(s.precioAcordado), 0);
  const totalNeto = sesiones.reduce((acc, s) => acc + calcularIngresoNeto(Number(s.precioAcordado)), 0);
  const totalComision = sesiones.reduce((acc, s) => acc + calcularComision(Number(s.precioAcordado)), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Ingresos</h1>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total sesiones completadas</p>
          <p className="text-3xl font-bold text-gray-900">{sesiones.length}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-green-600 mb-1">Ingresos netos (78%)</p>
          <p className="text-3xl font-bold text-green-700">{formatSoles(totalNeto)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Comisión ProfeLink (22%)</p>
          <p className="text-3xl font-bold text-gray-500">{formatSoles(totalComision)}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
        ProfeLink retiene el <strong>22%</strong> de cada sesión completada como comisión por el servicio.
        Recibes el <strong>78%</strong> restante.
      </div>

      {/* Tabla */}
      {sesiones.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No tienes sesiones completadas aún.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Estudiante</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Precio</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tu ingreso</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800">{s.estudiante.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.fechaInicio)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatSoles(Number(s.precioAcordado))}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatSoles(calcularIngresoNeto(Number(s.precioAcordado)))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-700" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right text-gray-700">{formatSoles(totalBruto)}</td>
                <td className="px-4 py-3 text-right text-green-700">{formatSoles(totalNeto)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
