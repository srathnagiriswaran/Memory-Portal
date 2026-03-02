#!/bin/bash
set -e

# Configuration
PROJECT_ID="memory-portal-488819"
REGION="us-central1"
REPO_NAME="memory-portal-repo"
APP_NAME="web-app"

echo "================================================"
echo "🚀 Deploying Memory Portal to GCP Cloud Run"
echo "================================================"

# Get the current Git commit hash for versioning the image
GIT_HASH=$(git rev-parse --short HEAD)
if [ -z "$GIT_HASH" ]; then
    echo "Error: Not a git repository or no commits found."
    exit 1
fi
IMAGE_TAG="us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$APP_NAME:$GIT_HASH"
LATEST_TAG="us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$APP_NAME:latest"

echo "📦 1/4: Building Docker image ($IMAGE_TAG)..."
cd web-app
# Export public env variables needed at build time
grep '^NEXT_PUBLIC_' .env.local > .env.production || true

docker build --platform linux/amd64 -t $IMAGE_TAG -t $LATEST_TAG .

echo "📤 2/4: Pushing Docker image to Artifact Registry..."
# Ensure docker auth is configured
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
docker push $IMAGE_TAG
docker push $LATEST_TAG

echo "🛠️  3/4: Updating Terraform configuration with new image..."
cd ../terraform
# Use sed/perl or simple awk to update the image_url in terraform.tfvars
# We'll create/update the image_url variable in terraform.tfvars
if grep -q "^image_url" terraform.tfvars; then
    # Cross-platform sed for updating in place
    sed -i.bak "s|^image_url.*|image_url = \"$IMAGE_TAG\"|" terraform.tfvars
    rm -f terraform.tfvars.bak
else
    echo "image_url = \"$IMAGE_TAG\"" >> terraform.tfvars
fi

echo "☁️  4/4: Applying Terraform to update Cloud Run..."
terraform apply -auto-approve

echo "✅ Deployment Complete!"
echo "Your app should be live shortly. Check the Terraform outputs above for the URL."
