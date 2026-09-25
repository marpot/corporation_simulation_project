# Infrastructure

- `kubernetes/` contains readable plain manifests for the complete application.
- `helm/` packages the same architecture with a small set of environment-facing values.
- `terraform/` demonstrates managing the Helm release in an explicitly selected cluster.

All deployment paths reference existing Kubernetes Secrets. No credentials are
stored in these directories. See the repository root README for deployment and
validation commands.
