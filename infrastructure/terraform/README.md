# Terraform example

This example uses the Helm provider to manage the local chart in an explicitly
selected Kubernetes context. It creates a namespace and installs the chart; it
does not create cloud resources or incur cloud cost.

The default context is `kind-corporation-sim`, which prevents accidentally
targeting another current context. The referenced `postgres-secret`,
`backend-secret`, and `ghcr-credentials` Secrets must already exist in the
target namespace. Secret values are deliberately outside Terraform state and
this repository.

Validation does not contact a cluster:

```bash
terraform init -backend=false
terraform fmt -check
terraform validate
```

To inspect the proposed deployment without applying it:

```bash
terraform plan
```

No `terraform apply` is required for this portfolio example.
