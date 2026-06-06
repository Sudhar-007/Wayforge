#!/usr/bin/env bash
# Deploy the prebuilt frontend/dist to Azure Static Web App "pathfinder-web".
# Contains no secrets: the deployment token is fetched from Azure at runtime
# into a shell variable. Build first (cd frontend && npm run build), then run
# this from the repo root:  bash deploy-swa.sh
set -euo pipefail

echo "Fetching deployment token from Azure..."
TOKEN=$(az staticwebapp secrets list -n pathfinder-web -g rg-pathfinder --query "properties.apiKey" -o tsv)

echo "Deploying frontend/dist to production..."
npx -y @azure/static-web-apps-cli deploy frontend/dist --deployment-token "$TOKEN" --env production
