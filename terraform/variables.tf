variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources to"
  type        = string
  default     = "us-central1"
}

variable "image_url" {
  description = "The URL of the Docker image in Artifact Registry. For initial creation, you can use a public image like gcr.io/cloudrun/hello until you push your own."
  type        = string
  default     = "gcr.io/cloudrun/hello" # Placeholder for initial run
}

# ------------------------------------------------------------------------------
# APPLICATION SECRETS (Saved to Google Secret Manager)
# ------------------------------------------------------------------------------

variable "gemini_api_key" {
  description = "The Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "frame_secret_key" {
  description = "A strong random string used to sign tokens for the Magic Frame device"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "The secret used by NextAuth.js to sign session cookies"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "The OAuth Client ID for Google Sign-In"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "The OAuth Client Secret for Google Sign-In"
  type        = string
  sensitive   = true
}

variable "firebase_client_email" {
  description = "The client email for the Firebase Admin SDK service account"
  type        = string
  sensitive   = true
}

variable "firebase_private_key" {
  description = "The private key for the Firebase Admin SDK service account"
  type        = string
  sensitive   = true
}