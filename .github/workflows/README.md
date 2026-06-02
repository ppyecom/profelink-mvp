# CI/CD — Cómo funciona

Este proyecto usa **GitHub Actions** para automatizar 2 cosas:

## 1️⃣ `ci.yml` — Validación automática
**Cuándo corre:** en cada `push` a `main` y en cada Pull Request.

**Qué hace:**
- Instala dependencias (`npm ci`)
- Genera el cliente de Prisma
- Verifica tipos de TypeScript (`tsc --noEmit`)
- Compila la app de Next.js (`npm run build`)

Si algo falla, GitHub te avisa con un ✗ rojo y **no permite mergear el PR**.

## 2️⃣ `deploy.yml` — Despliegue automático
**Cuándo corre:** en cada `push` a `main`.

**Qué hace:**
- Se conecta por SSH al servidor Ubuntu
- Hace `git pull && npm ci && npm run build && pm2 restart`
- Verifica que la app responda en https://profelink.pyecommerce.com

---

## 🔐 Configurar los Secrets (UNA SOLA VEZ)

Para que `deploy.yml` funcione, hay que darle a GitHub las credenciales SSH del servidor.

### Paso 1 — Generar una SSH key en el servidor Ubuntu

```bash
# Desde el Ubuntu, conectado como el usuario profelink:
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# Agregar la pública a authorized_keys (para que pueda entrar)
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Mostrar la clave PRIVADA (la copias completa)
cat ~/.ssh/github_actions_key
```

Copia TODO desde `-----BEGIN OPENSSH PRIVATE KEY-----` hasta `-----END OPENSSH PRIVATE KEY-----` incluidas.

### Paso 2 — Agregar Secrets en GitHub

1. Entra a https://github.com/ppyecom/profelink-mvp/settings/secrets/actions
2. **New repository secret** → agrega estos 3:

| Name | Value |
|---|---|
| `SSH_HOST` | `profelink.pyecommerce.com` |
| `SSH_USER` | `profelink` |
| `SSH_PRIVATE_KEY` | La clave privada completa (pegar todo) |

### Paso 3 — Probar

Haz cualquier cambio mínimo y `git push`. Ve a la pestaña **Actions** del repo y mira cómo corre.

---

## 🧪 Disparar deploy manualmente (sin hacer push)

Pestaña **Actions** → workflow **Deploy** → botón **Run workflow**.
