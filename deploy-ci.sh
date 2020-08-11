#!/bin/bash

# The script is set to fail on unbound variables, so take care when checking if they have
# been set. See: https://unix.stackexchange.com/questions/463034/bash-throws-error-line-8-1-unbound-variable
set -euo pipefail

check_env_variables () {  
  if [ -z "${LIGHTSTEP_ACCESS_TOKEN-}" ]
  then
    echo Please set the LIGHTSTEP_ACCESS_TOKEN environment variable
    exit 1
  fi
}

gcp_config () {
  if [ -z "${GCP_SERVICE_KEY-}" ]
  then
    echo Please set the GCP_SERVICE_KEY environment variable
    exit 1
  fi

  if [ -z "${GCP_ZONE-}" ]
  then
    echo Please set the GCP_ZONE environment variable
    exit 1
  fi


  if [ -z "${GCP_PROJECT_ID-}" ]
  then
    echo Please set the GCP_PROJECT_ID environment variable
    exit 1
  fi

  if [ -z "${GCP_K8S_CLUSTER-}" ]
  then
    echo Please set the GCP_K8S_CLUSTER environment variable
    exit 1
  fi

  if [ -z "${DEFAULT_IMAGE_REPO-}" ]
  then
    echo Setting DEFAULT_IMAGE_REPO to gcr.io/$GCP_PROJECT_ID
    export DEFAULT_IMAGE_REPO=gcr.io/$GCP_PROJECT_ID
  fi

  echo "$GCP_SERVICE_KEY" > gcloud-service-key.json
  gcloud auth activate-service-account --key-file gcloud-service-key.json
  gcloud config set project $GCP_PROJECT_ID
  gcloud config set compute/zone $GCP_ZONE
  gcloud container clusters get-credentials $GCP_K8S_CLUSTER
}

skaffold_deploy() {
  kubectl config get-contexts
  kubectl create secret generic lightstep-credentials --from-literal=accessToken=$LIGHTSTEP_ACCESS_TOKEN || echo "Secret already present, not updated."
  # no-prune and cache-artificts due to docker-in-docker running out of disk space
  skaffold run --no-prune=false --cache-artifacts=false --default-repo=$DEFAULT_IMAGE_REPO  
}

echo 
echo Skaffold CI Deploy Script Helper
echo
echo This script helps deploy instrumented apps in this repository to Google Cloud

check_env_variables
gcp_config
skaffold_deploy
