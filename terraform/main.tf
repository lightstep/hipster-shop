variable "region" {
  default = "us-central1"
}

variable "zone" {
  default = "us-central1-c"
}

variable "project" {}

# to load credentials, run:
# `gcloud auth application-default login`
#provider "google" {
#  project     = var.project
#  region      = var.region
#}

module "gke" {
  source                     = "terraform-google-modules/kubernetes-engine/google"
  project_id                 = var.project
  name                       = "gke-hipster-shop"
  region                     = "us-central1"
  zones                      = ["us-central1-c"]
  network                    = "default"
  subnetwork                 = ""
  ip_range_pods              = ""
  ip_range_services          = ""

  horizontal_pod_autoscaling = true
  grant_registry_access      = true
  create_service_account     = true

  node_pools = [
    {
      name               = "default-node-pool"
      min_count          = 1
      max_count          = 4
      auto_repair        = false
      auto_upgrade       = true
      preemptible        = true
      initial_node_count = 4
    },
  ]

  node_pools_oauth_scopes = {
    all = []

    default-node-pool = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}