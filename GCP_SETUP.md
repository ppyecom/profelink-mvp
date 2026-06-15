# 🚀 Migración a GCP — Guía paso a paso

## Estado actual del repo

El código ya está **preparado** para GCP:

- ✅ `Dockerfile` multi-stage
- ✅ `next.config.ts` con `output: 'standalone'`
- ✅ `lib/storage.ts` que cambia entre local/GCS según env var `STORAGE_DRIVER`
- ✅ `.github/workflows/deploy-gcp.yml` con deploy a Cloud Run
- ✅ Funciona en local sin tocar nada (DRIVER por defecto = `local`)

A continuación, los pasos que **TÚ tienes que hacer**.

---

## 1️⃣ Cuenta GCP + proyecto (10 min)

```bash
# Instala gcloud CLI (Windows): https://cloud.google.com/sdk/docs/install
# Después:
gcloud auth login
gcloud projects create profelink-prod --name="ProfeLink"
gcloud config set project profelink-prod
gcloud config set compute/region southamerica-east1
gcloud config set run/region southamerica-east1

# Asocia tu cuenta de billing (necesario aunque uses solo crédito gratis)
gcloud billing accounts list
gcloud billing projects link profelink-prod --billing-account=<TU_BILLING_ID>

# Habilita las APIs necesarias
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  iamcredentials.googleapis.com
```

## 2️⃣ Cloud SQL — Postgres (15 min)

```bash
# Crear instancia
gcloud sql instances create profelink-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=southamerica-east1 \
  --root-password='ELIGE_UNA_PASS_FUERTE_ROOT'

# Crear la BD
gcloud sql databases create profelink --instance=profelink-db

# Usuario de app
gcloud sql users create profelink \
  --instance=profelink-db \
  --password='OTRA_PASS_FUERTE_APP'

# Obtén el connection name (cópialo, lo necesitas)
gcloud sql instances describe profelink-db --format="value(connectionName)"
# Ejemplo: profelink-prod:southamerica-east1:profelink-db
```

**Migrar los datos desde tu VM:**

```bash
# En la VM
sudo -u postgres pg_dump --no-owner --no-acl profelink > /tmp/profelink.sql

# Descarga el dump a tu máquina
scp profelink@<vm-ip>:/tmp/profelink.sql ./profelink-dump.sql

# Súbelo a Cloud Storage (creamos el bucket en el paso 3)
gsutil cp ./profelink-dump.sql gs://profelink-migration/

# Da permisos al service account de Cloud SQL para leer el bucket
SA=$(gcloud sql instances describe profelink-db --format='value(serviceAccountEmailAddress)')
gsutil iam ch serviceAccount:$SA:objectViewer gs://profelink-migration

# Importa
gcloud sql import sql profelink-db gs://profelink-migration/profelink-dump.sql --database=profelink
```

## 3️⃣ Cloud Storage — uploads (10 min)

```bash
# Crear bucket
gsutil mb -l southamerica-east1 gs://profelink-uploads
gsutil mb -l southamerica-east1 gs://profelink-migration  # para el dump

# Sube los uploads existentes
gsutil -m cp -r ~/profelink-mvp/public/uploads/* gs://profelink-uploads/
```

## 4️⃣ Secret Manager (5 min)

```bash
# Adapta el DATABASE_URL al formato de Cloud SQL (Unix socket)
CONN="profelink-prod:southamerica-east1:profelink-db"

echo -n "tu_jwt_secret_super_seguro"       | gcloud secrets create JWT_SECRET            --data-file=-
echo -n "re_xxxxx_tu_resend_key"           | gcloud secrets create RESEND_API_KEY        --data-file=-
echo -n "GOCSPX-tu_google_client_secret"   | gcloud secrets create GOOGLE_CLIENT_SECRET  --data-file=-
echo -n "postgresql://profelink:OTRA_PASS_FUERTE_APP@/profelink?host=/cloudsql/$CONN" \
                                            | gcloud secrets create DATABASE_URL          --data-file=-
```

## 5️⃣ Artifact Registry — repo Docker (3 min)

```bash
gcloud artifacts repositories create profelink \
  --repository-format=docker \
  --location=southamerica-east1
```

## 6️⃣ Service Account + Workload Identity (10 min)

Esto permite que GitHub Actions despliegue sin guardar credenciales en secrets.

```bash
# Service account que usará el deploy
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer"

SA_EMAIL="github-deployer@profelink-prod.iam.gserviceaccount.com"

# Permisos mínimos
for ROLE in \
  roles/run.admin \
  roles/storage.admin \
  roles/secretmanager.secretAccessor \
  roles/artifactregistry.writer \
  roles/iam.serviceAccountUser \
  roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding profelink-prod \
    --member="serviceAccount:$SA_EMAIL" --role="$ROLE"
done

# Workload Identity Pool
gcloud iam workload-identity-pools create github \
  --location=global --display-name="GitHub Pool"

POOL_ID=$(gcloud iam workload-identity-pools describe github --location=global --format='value(name)')

gcloud iam workload-identity-pools providers create-oidc profelink \
  --location=global \
  --workload-identity-pool=github \
  --display-name="ProfeLink Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Permite a tu repo de GitHub usar este SA (cambia ppyecom/profelink-mvp por tu repo)
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/ppyecom/profelink-mvp"

# Obtén los valores para los secrets de GitHub
echo "GCP_WIF_PROVIDER = $POOL_ID/providers/profelink"
echo "GCP_SA_EMAIL     = $SA_EMAIL"
```

## 7️⃣ Secrets en GitHub

Ve a `https://github.com/ppyecom/profelink-mvp/settings/secrets/actions` y agrega:

| Nombre | Valor |
|---|---|
| `GCP_WIF_PROVIDER` | el del paso 6 |
| `GCP_SA_EMAIL` | `github-deployer@profelink-prod.iam.gserviceaccount.com` |
| `CLOUDSQL_CONNECTION_NAME` | `profelink-prod:southamerica-east1:profelink-db` |
| `GCS_BUCKET` | `profelink-uploads` |
| `PUBLIC_APP_URL` | `https://profelink.pyecommerce.com` |
| `GOOGLE_CLIENT_ID` | tu Client ID actual |

## 8️⃣ Primer deploy

En GitHub: `Actions → Deploy to GCP Cloud Run → Run workflow`.

Si todo va bien al final del log verás:

```
✅ Deploy OK
Service URL: https://profelink-xxxxx-rj.a.run.app
```

Pruébala en el navegador. **YA ESTÁ EN GCP**.

## 9️⃣ Apuntar tu dominio (5 min + propagación DNS)

```bash
gcloud run domain-mappings create \
  --service=profelink \
  --domain=profelink.pyecommerce.com \
  --region=southamerica-east1
```

GCP te dará registros DNS — agrégalos en **Cloudflare**.
Cambia el `CNAME` de tu subdominio para que apunte a `ghs.googlehosted.com`.

Después de 1–2 horas (a veces hasta 24), tu dominio responde directamente desde Cloud Run.

## 🔟 Cron de recordatorios (5 min)

```bash
# Crea un token interno (úsalo en tu app para validar el caller)
TOKEN_CRON=$(openssl rand -hex 32)
echo -n "$TOKEN_CRON" | gcloud secrets create CRON_TOKEN --data-file=-

# Job que llama cada 15 min al endpoint de recordatorios
gcloud scheduler jobs create http recordatorios \
  --location=southamerica-east1 \
  --schedule="*/15 * * * *" \
  --uri="https://profelink.pyecommerce.com/api/cron/recordatorios" \
  --http-method=POST \
  --headers="Authorization=Bearer $TOKEN_CRON"
```

---

## 🔁 Después del switch: apagar la VM

Cuando confirmes que GCP responde bien (dale 1 semana de prueba):

1. Borra `.github/workflows/deploy.yml` (el de self-hosted)
2. Cambia `deploy-gcp.yml` para que tire en cada push:
   ```yaml
   on: { push: { branches: [main] } }
   ```
3. Apaga la VM (`pm2 stop all && sudo poweroff`)
4. Quita el túnel de Cloudflare (`sudo systemctl disable cloudflared`)

---

## 💰 Costo mensual estimado

| Servicio | Costo |
|---|---|
| Cloud Run (1 instancia min, ~500 users) | $0–5 |
| Cloud SQL db-f1-micro | $10 |
| Cloud Storage 5 GB | $1 |
| Cloud Scheduler | $0 (3 jobs free) |
| Secret Manager | $0 (6 secrets free) |
| **TOTAL** | **~$15/mes** |

Con los **$300 USD gratis** = ~20 meses sin pagar.

---

## ❓ Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `Cannot connect to database` | Connection string mal | Verifica `?host=/cloudsql/<connection>` |
| `403 Forbidden` al desplegar | Falta permiso en SA | Re-corre el paso 6 |
| `Cold start` 2-3s | `min-instances=0` | Sube a `1` (cuesta ~$7 más/mes) |
| Imágenes no se ven | Sigues con DRIVER=local | Cambia env `STORAGE_DRIVER=gcs` |
| Subidas viejas no aparecen | No migraste los uploads | Re-corre paso 3 |
