# CI — Integración Continua

Este proyecto usa **GitHub Actions** para validar el código automáticamente.

## `ci.yml` — Validación automática

**Cuándo corre:** en cada `push` a `main` y en cada Pull Request.

**Qué hace:**
- Instala dependencias (`npm ci`)
- Genera el cliente de Prisma
- Verifica tipos de TypeScript (`tsc --noEmit`)
- Compila la app de Next.js (`npm run build`)

Si algo falla, GitHub muestra ✗ rojo y **bloquea el merge del PR**.

## `deploy.yml` — Despliegue automático

**Cuándo corre:** en cada `push` a `main`.

**Cómo funciona:** usa un **self-hosted runner** instalado en la propia VM
Ubuntu. El runner se conecta a GitHub de salida (no necesita SSH ni puertos
abiertos), recibe la orden de despliegue y ejecuta:

1. `rsync` del código nuevo al directorio de la app
2. `npm ci` + `npx prisma generate`
3. `npm run build`
4. `pm2 restart profelink`
5. Health check a `https://profelink.pyecommerce.com`

### Configurar el runner (una sola vez)

1. GitHub → Settings → Actions → Runners → **New self-hosted runner**
2. Ejecutar los comandos generados en la VM
3. Instalar como servicio:
   ```bash
   sudo ./svc.sh install profelink
   sudo ./svc.sh start
   ```
