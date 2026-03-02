# Memory Portal GCP Deployment Guide

This directory contains the Terraform configuration to deploy the Memory Portal web application to Google Cloud Platform using Cloud Run (Serverless) and Google Secret Manager.

## Architecture

*   **Google Artifact Registry**: Stores the Docker images for the Next.js application.
*   **Google Secret Manager**: Securely stores backend secrets (API keys, OAuth credentials, etc.) so they are not exposed in plaintext.
*   **Google Cloud Run**: Serverless compute platform that runs the Docker containers. It automatically pulls secrets from Secret Manager and mounts them as environment variables at runtime. It scales to 0 when not in use to save costs.
*   **Custom Service Account**: A dedicated service account mapped to Cloud Run with strict permissions only to read its specific secrets from Secret Manager.

## Prerequisites

1.  **GCP Project**: You need an active Google Cloud Project with billing enabled.
2.  **Google Cloud CLI (`gcloud`)**: Installed and authenticated locally (`gcloud auth login`).
3.  **Terraform**: Installed locally.

## Deployment Steps

### 1. Set Up Your Secrets (Local Configuration)

Before deploying, you need to configure your variables. The actual secrets are read locally by Terraform and pushed directly to Google Secret Manager. 

1. Copy the example variables file:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Open `terraform.tfvars` and fill in your actual project ID, region, and all the required secret values (Gemini API Key, Google OAuth credentials, Firebase credentials, etc.).

> **Note:** The `terraform.tfvars` file is explicitly ignored in `.gitignore` to ensure you don't accidentally commit your secrets to version control.

### 2. Initialize Terraform

Navigate to the `terraform` directory and initialize Terraform:

```bash
terraform init
```

### 3. Apply Terraform (Initial Setup)

This step will:
- Enable necessary GCP APIs.
- Create the Artifact Registry repository.
- Upload your secrets to Google Secret Manager.
- Create a placeholder Cloud Run service.

```bash
terraform apply
```

### 4. Build and Push the Docker Image

Navigate back to the `web-app` directory. Because Next.js `NEXT_PUBLIC_*` variables are baked into the frontend build at compile time, you must ensure they are present during the Docker build process.

If you have a local `.env.local` or `.env.production` file containing your `NEXT_PUBLIC_` Firebase config variables, Docker will *not* automatically see them unless you explicitly pass them. Ensure you have an `.env.production` file in your `web-app` directory with the public variables (do *not* include the sensitive backend variables here, those are in Secret Manager now).

Configure Docker to authenticate with GCP Artifact Registry:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Build the image (replace `YOUR_GCP_PROJECT_ID`):
```bash
cd ../web-app
docker build -t us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/memory-portal-repo/web-app:latest .
```

Push the image:
```bash
docker push us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/memory-portal-repo/web-app:latest
```

### 5. Deploy the Actual Image to Cloud Run

Once the image is in Artifact Registry, update the Cloud Run service via the `gcloud` CLI to use your real image. Note that we do **not** need to pass `--set-env-vars` for secrets anymore, because Terraform already configured Cloud Run to pull them from Secret Manager dynamically!

```bash
gcloud run deploy memory-portal-app \
  --image us-central1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/memory-portal-repo/web-app:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Updating Secrets in the Future

If you ever need to rotate a key (e.g., your Gemini API Key or Firebase Private Key):
1. Update your local `terraform.tfvars` file.
2. Run `terraform apply` again. Terraform will push the new secret version to Secret Manager.
3. Because Cloud Run is configured to use the `latest` version of the secrets, the new instances will automatically pick up the new secret the next time a container starts (you may want to manually trigger a new deployment to force all existing instances to recycle).