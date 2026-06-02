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

## Deploy

El despliegue al servidor se hace **manualmente** porque el servidor Ubuntu
está en red local (no expuesto a internet por SSH).

Desde el servidor:

```bash
cd ~/profelink-mvp
git pull
npm ci
npx prisma generate
rm -rf .next && npm run build
pm2 restart profelink
```

> Si en el futuro se expone SSH (Cloudflare Tunnel, VPN o port forward),
> se puede agregar un workflow `deploy.yml` para automatizar este paso.
