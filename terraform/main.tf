variable "region" {
  default = "us-central1"
}

variable "zone" {
  default = "us-central1-c"
}

variable "project" {}

# to load credentials, run:
# `gcloud auth application-default login`
provider "google" {
  project     = var.project
  region      = var.region
}

resource "google_container_cluster" "primary" {
  name     = "hipster-shop-cluster"
  location = var.zone

  # We can't create a cluster without a node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  name       = "my-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 4

  node_config {
    preemptible  = true

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }
}
