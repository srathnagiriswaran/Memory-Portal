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
3. Note that `image_url` is automatically populated by the deployment script, so you don't need to specify it initially.

> **Note:** The `terraform.tfvars` file is explicitly ignored in `.gitignore` to ensure you don't accidentally commit your secrets to version control.

### 2. State File Management

By default, Terraform stores its state locally in a `terraform.tfstate` file. **This file is explicitly ignored in `.gitignore`** because it can contain sensitive information in plaintext (including the values of the secrets you just created). 

*   **Single Developer:** Running locally with the ignored `.tfstate` file is fine for solo development.
*   **Multi-Developer / Production Team:** If multiple people need to deploy changes or if you run deployments through a CI/CD pipeline (like GitHub Actions), you **must** configure a remote state backend (e.g., using a Google Cloud Storage bucket) so the state is shared and locked securely. Add a `backend "gcs"` block to your `terraform {}` configuration in `main.tf`.

### 3. Initialize Terraform

Navigate to the `terraform` directory and initialize Terraform:

```bash
terraform init
```

### 4. Deploying the Application (One-Click)

Instead of manually running Terraform apply and Docker commands every time, we use a unified deployment script that handles the entire build, push, and deploy lifecycle.

Navigate to the root of the project and run:

```bash
./deploy.sh
```

**What this script does:**
1.  **Extracts Public Env Vars:** Grabs `NEXT_PUBLIC_` variables from `web-app/.env.local` to bake into the frontend.
2.  **Builds the Docker Image:** Builds the Next.js app optimized for Cloud Run (`linux/amd64`), tagged with your latest git commit hash.
3.  **Pushes to Artifact Registry:** Uploads the image to GCP.
4.  **Updates Terraform:** Automatically modifies `image_url` in your `terraform.tfvars` file to point to the exact new image digest.
5.  **Applies Infrastructure:** Runs `terraform apply -auto-approve` to provision missing resources (like Secret Manager secrets) and roll out the new container revision to Cloud Run seamlessly.

### Updating Secrets or App Code in the Future

If you ever need to rotate a key, update your local `terraform.tfvars` file. 
If you make code changes in the Next.js application, simply commit your changes locally and run `./deploy.sh` again from the project root!