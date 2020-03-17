#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Check for Kubernetes Nodes
kube_node_check () {
  echo
  echo Checking Kubernetes connection
  output=$(kubectl get nodes)
  [[ $output = "The connection to the server kubernetes.docker.internal:6443 was refused - did you specify the right host or port?" ]] && echo Problem connecting to Kubernetes
  [[ $output != "The connection to the server kubernetes.docker.internal:6443 was refused - did you specify the right host or port?" ]] && echo Connection verified
}

# Lightstep access token
set_ls_access_token () {
  echo Setting up an lightstep-access-token secret in Kubernetes
  kubectl create secret generic lightstep-access-token --from-literal=token="$LIGHTSTEP_ACCESS_TOKEN" || echo "Secret already present, not updated."
  echo
}

# Run skaffold
run_skaffold () {
  echo
  echo Running skaffold to build and deploy the application
  echo If this is you\'re first time building, it could take around ~20 minutes.
  echo Time to grab some coffee!
  skaffold run
}

# Success
success_message () {
  echo
  echo Lightstep mock application is running, happy hacking!
  echo Go to http://localhost/ to visit the application.
  echo Visit https://app.lightstep.com to see the trace data.
}

# Wait for store
wait_for_store () {
  echo -n "Waiting for store to be ready.."
  while true; do
    echo -n "."
    curl -s -q http://localhost > /dev/null
    rc=$?
    if [ $rc == 0 ]; then
      echo "done!"
      return
    fi
    sleep 1
  done
}

# Called if the user is deploying to GKE. Ensures the necessary environment
# variables are set.
gke_steps () {
  echo
  echo Great!
  echo

  if [ -z "$GCP_PROJECT_ID" ]  
  then
    echo Please set the GCP_PROJECT_ID environment variable first
    echo so we know where to deploy the cluster! See the README
    echo if you need help!
    echo
    exit
  fi

  make run
}

# Docker for Desktop steps
docker_for_desktop_steps () {
 echo
 echo Great! Please, launch Docker for Desktop and go to \"Preferences\": 
 echo • choose \"Enable Kubernetes \"
 echo • set CPUs to at least 3, and Memory to at least 6.0 GiB
 echo • on the "Disk" tab, set at least 32 GB disk space
 echo
 read -p "Is Docker for Desktop configured and running? (y/n) " -n 1 -r
 echo    # (optional) move to a new line
 if [[ $REPLY =~ ^[Yy]$ ]]
 then
  kube_node_check #TODO better error handling
  set_ls_access_token
  run_skaffold
  wait_for_store
  success_message
 fi
}

# Minikube steps
minikube_steps () {
 echo
 echo Great! Please, launch Minikube with at least 4 CPU\'s and 4Gib memory
 echo
 read -p "Is Minikube is running? (y/n)" -n 1 -r
 echo    # (optional) move to a new line
 if [[ $REPLY =~ ^[Yy]$ ]]
 then
  echo Starting Minikube
  minikube start --cpus=4 --memory 4096
  kube_node_check #TODO better error handling
  set_ls_access_token
  run_skaffold
  wait_for_store
  success_message
 fi
}

check_lightstep_access_token () {
  local KUBESECRET
  KUBESECRET=$(kubectl get secret lightstep-access-token -o go-template --template "{{.data.token}}" 2>/dev/null | base64 --decode) || ''
  if [ ! -z "$KUBESECRET" ]
  then
    echo Lightstep access token already defined as a Kubernetes secret. Proceeding!
    return
  fi
  if [ -z "$LIGHTSTEP_ACCESS_TOKEN" ]
  then
    echo Please set the LIGHTSTEP_ACCESS_TOKEN environment variable to get
    echo started. Check out the README if you need help.
    echo
    exit
  fi
}

# Welcome
echo 
echo Welcome to the Lightstep Mock Application Setup!
echo
check_lightstep_access_token
echo Help answer a couple questions about your environment and we\'ll get you up and running.
echo
# What Kubernetes cluster is being used?
echo What kind of Kubernetes cluster are you using?
PS3='Please enter your choice: '
options=("Google Kubernetes Engine (GKE)" "Docker for Desktop" "Minikube" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Google Kubernetes Engine (GKE)")
            gke_steps
            break
            ;;
        "Docker for Desktop")
            docker_for_desktop_steps
            break
            ;;
        "Minikube")
            minikube_steps
            break
            ;;
        "Quit")
            break
            ;;
        *) echo "Please enter a number for one of the options above";;
    esac
done