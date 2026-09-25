variable "kubeconfig_path" {
  description = "Path to the kubeconfig used by the Helm provider."
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Explicit Kubernetes context. The default protects other local clusters from accidental use."
  type        = string
  default     = "kind-corporation-sim"
}

variable "namespace" {
  description = "Namespace in which the Helm release would be installed."
  type        = string
  default     = "corporation-sim"
}

variable "release_name" {
  description = "Helm release name."
  type        = string
  default     = "corporation-simulation"
}

variable "backend_image_tag" {
  description = "Backend image tag to deploy."
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Frontend image tag to deploy."
  type        = string
  default     = "latest"
}

variable "database_secret_name" {
  description = "Name of a pre-created Secret containing PostgreSQL settings and DATABASE_URL."
  type        = string
  default     = "postgres-secret"
}

variable "application_secret_name" {
  description = "Name of a pre-created Secret containing JWT_SECRET_KEY."
  type        = string
  default     = "backend-secret"
}

variable "image_pull_secret_name" {
  description = "Name of a pre-created image pull Secret for GHCR."
  type        = string
  default     = "ghcr-credentials"
}
