#!/bin/bash

#
# Personal Dashboard Deployment Script
# Deploys to Google Cloud Run
#
# Usage:
#   ./deploy.sh           # Full deployment
#   ./deploy.sh build     # Only build Docker image
#   ./deploy.sh push      # Only push to GCR
#   ./deploy.sh deploy    # Only deploy to Cloud Run
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Load environment variables from server/.env
load_env() {
    log_info "Loading configuration from server/.env..."

    if [ ! -f "server/.env" ]; then
        log_error "server/.env file not found!"
        exit 1
    fi

    # Export variables from .env file
    set -a
    source server/.env
    set +a

    # Validate required variables
    if [ -z "$GCP_PROJECT_ID" ] || [ -z "$GCP_REGION" ] || [ -z "$CLOUD_RUN_SERVICE" ]; then
        log_error "Missing required variables in server/.env"
        log_error "Required: GCP_PROJECT_ID, GCP_REGION, CLOUD_RUN_SERVICE"
        exit 1
    fi

    log_success "Configuration loaded"
    echo "  Project: $GCP_PROJECT_ID"
    echo "  Region: $GCP_REGION"
    echo "  Service: $CLOUD_RUN_SERVICE"
}

# Build Docker image
build_image() {
    log_section "Building Docker Image"

    TIMESTAMP=$(date +%s)
    IMAGE_NAME="gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE"
    IMAGE_TAG="$IMAGE_NAME:$TIMESTAMP"
    IMAGE_LATEST="$IMAGE_NAME:latest"

    log_info "Building image:"
    echo "  Tag: $IMAGE_TAG"
    echo "  Latest: $IMAGE_LATEST"
    echo "  Platform: linux/amd64 (Cloud Run compatible)"
    echo ""

    docker build \
        --platform linux/amd64 \
        -t "$IMAGE_TAG" \
        -t "$IMAGE_LATEST" \
        -f Dockerfile \
        .

    log_success "Docker image built successfully"
    echo ""
}

# Push image to Google Container Registry
push_image() {
    log_section "Pushing to Google Container Registry"

    IMAGE_NAME="gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE"

    log_info "Pushing image: $IMAGE_NAME:latest"
    echo ""

    docker push "$IMAGE_NAME:latest"

    log_success "Image pushed to GCR successfully"
    echo ""
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    log_section "Deploying to Cloud Run"

    IMAGE_NAME="gcr.io/$GCP_PROJECT_ID/$CLOUD_RUN_SERVICE:latest"

    log_info "Deploying to Cloud Run:"
    echo "  Project: $GCP_PROJECT_ID"
    echo "  Service: $CLOUD_RUN_SERVICE"
    echo "  Region: $GCP_REGION"
    echo "  Image: $IMAGE_NAME"
    echo ""

    # Confirmation prompt
    read -p "$(echo -e ${YELLOW}⚠${NC})  Deploy to production? [y/N]: " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled"
        exit 0
    fi

    echo ""
    log_info "Deploying..."
    echo ""

    # Build env vars string (mask sensitive values in output)
    ENV_VARS="NODE_ENV=production"
    ENV_VARS="$ENV_VARS,GCP_PROJECT_ID=$GCP_PROJECT_ID"

    if [ -n "$SPOTIFY_CLIENT_ID" ]; then
        ENV_VARS="$ENV_VARS,SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID"
    fi

    if [ -n "$SPOTIFY_CLIENT_SECRET" ]; then
        ENV_VARS="$ENV_VARS,SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET"
    fi

    if [ -n "$GOOGLE_PLACES_API_KEY" ]; then
        ENV_VARS="$ENV_VARS,GOOGLE_PLACES_API_KEY=$GOOGLE_PLACES_API_KEY"
    fi

    # Deploy to Cloud Run
    gcloud run deploy "$CLOUD_RUN_SERVICE" \
        --image "$IMAGE_NAME" \
        --platform managed \
        --region "$GCP_REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --project "$GCP_PROJECT_ID" \
        --set-env-vars="$ENV_VARS" \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10

    echo ""
    log_success "Deployed to Cloud Run successfully"

    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
        --region "$GCP_REGION" \
        --project "$GCP_PROJECT_ID" \
        --format='value(status.url)')

    echo ""
    log_section "Deployment Complete"
    echo -e "${GREEN}🎉  Your app is live!${NC}"
    echo ""
    echo -e "  URL: ${BLUE}$SERVICE_URL${NC}"
    echo ""
}

# Main execution
main() {
    COMMAND=${1:-full}

    case $COMMAND in
        build)
            load_env
            build_image
            ;;
        push)
            load_env
            push_image
            ;;
        deploy)
            load_env
            deploy_to_cloud_run
            ;;
        full|"")
            log_section "Full Deployment Pipeline"
            load_env
            build_image
            push_image
            deploy_to_cloud_run
            ;;
        *)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  build   - Build Docker image only"
            echo "  push    - Push image to GCR only"
            echo "  deploy  - Deploy to Cloud Run only"
            echo "  full    - Run full deployment (default)"
            echo ""
            echo "Example:"
            echo "  $0 full"
            exit 1
            ;;
    esac
}

# Run main
main "$@"
