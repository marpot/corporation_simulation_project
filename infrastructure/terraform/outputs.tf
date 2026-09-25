output "release_name" {
  description = "Name of the Helm release Terraform would manage."
  value       = helm_release.corporation_simulation.name
}

output "namespace" {
  description = "Kubernetes namespace containing the release."
  value       = helm_release.corporation_simulation.namespace
}
