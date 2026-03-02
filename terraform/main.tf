terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ------------------------------------------------------------------------------
# ENABLE REQUIRED APIS
# ------------------------------------------------------------------------------

resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild_api" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager_api" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# ------------------------------------------------------------------------------
# ARTIFACT REGISTRY
# ------------------------------------------------------------------------------

resource "google_artifact_registry_repository" "memory_portal_repo" {
  provider      = google
  location      = var.region
  repository_id = "memory-portal-repo"
  description   = "Docker repository for Memory Portal"
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry_api]
}

# ------------------------------------------------------------------------------
# SECRET MANAGER CONFIGURATION
# ------------------------------------------------------------------------------

# Service Account for Cloud Run to securely access secrets
resource "google_service_account" "cloudrun_sa" {
  account_id   = "memory-portal-sa"
  display_name = "Memory Portal Cloud Run Service Account"
}

# Map of all secrets required by the application
locals {
  secrets = {
    "gemini-api-key"        = { env = "GEMINI_API_KEY", value = var.gemini_api_key }
    "frame-secret-key"      = { env = "FRAME_SECRET_KEY", value = var.frame_secret_key }
    "nextauth-secret"       = { env = "NEXTAUTH_SECRET", value = var.nextauth_secret }
    "google-client-id"      = { env = "GOOGLE_CLIENT_ID", value = var.google_client_id }
    "google-client-secret"  = { env = "GOOGLE_CLIENT_SECRET", value = var.google_client_secret }
    "firebase-client-email" = { env = "FIREBASE_CLIENT_EMAIL", value = var.firebase_client_email }
    "firebase-private-key"  = { env = "FIREBASE_PRIVATE_KEY", value = var.firebase_private_key }
  }
}

# Provision Secret Manager Secrets
resource "google_secret_manager_secret" "app_secrets" {
  for_each  = local.secrets
  secret_id = "memory-portal-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]
}

# Upload the secret data (from terraform variables) into Secret Manager
resource "google_secret_manager_secret_version" "app_secrets_versions" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value.value
}

# Grant the Cloud Run Service Account access to read these specific secrets
resource "google_secret_manager_secret_iam_member" "secret_access" {
  for_each  = local.secrets
  secret_id = google_secret_manager_secret.app_secrets[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# ------------------------------------------------------------------------------
# CLOUD RUN SERVICE
# ------------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "memory_portal_app" {
  name     = "memory-portal-app"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    # Attach our custom service account
    service_account = google_service_account.cloudrun_sa.email

    containers {
      image = var.image_url # Defaults to a placeholder until a real image is pushed
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXTAUTH_URL"
        value = var.nextauth_url
      }
      
      # Dynamically inject all secrets from Google Secret Manager as environment variables
      dynamic "env" {
        for_each = local.secrets
        content {
          name = env.value.env
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app_secrets[env.key].secret_id
              version = "latest"
            }
          }
        }
      }
    }
    
    scaling {
      max_instance_count = 10
      min_instance_count = 0 # Scale to 0 to save costs
    }
  }

  depends_on = [
    google_project_service.run_api,
    google_secret_manager_secret_iam_member.secret_access # Ensure permissions exist before creating service
  ]
}

# Make the Cloud Run service publicly accessible over the internet
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.memory_portal_app.location
  service  = google_cloud_run_v2_service.memory_portal_app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------

output "service_url" {
  description = "The public URL of the deployed Memory Portal application."
  value       = google_cloud_run_v2_service.memory_portal_app.uri
}