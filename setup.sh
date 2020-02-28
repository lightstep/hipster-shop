#!/bin/bash

# Check for Kubernetes Nodes
kube_node_check () {
  echo
  echo Checking Kubernetes connection
  output=$(kubectl get nodes)
  [[ $output = "The connection to the server kubernetes.docker.internal:6443 was refused - did you specify the right host or port?" ]] && echo Problem connecting to Kubernetes
  [[ $output -ne "The connection to the server kubernetes.docker.internal:6443 was refused - did you specify the right host or port?" ]] && echo Connection verified
}

# Lightstep access token
set_ls_access_token () {
  kubectl create secret generic ls-access-token --from-literal=token=$1
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
  echo -n "Waiting for store to be ready"
  while [ 1 ]; do
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
  set_ls_access_token $1
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
  set_ls_access_token $1
  run_skaffold
  wait_for_store
  success_message
 fi
}

# Welcome
echo Welcome to the Lightstep Mock Application Setup!
echo Help answer a couple questions about your environment and we\'ll get you up and running.
echo
# What local Kubernetes cluster is being used?
echo What kind of local Kubernetes cluster are you using?
PS3='Please enter your choice: '
options=("Docker for Desktop" "Minikube" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Docker for Desktop")
            docker_for_desktop_steps $1
            break
            ;;
        "Minikube")
            minikube_steps  $1
            break
            ;;
        "Quit")
            break
            ;;
        *) echo "Please enter a number for one of the options above";;
    esac
done