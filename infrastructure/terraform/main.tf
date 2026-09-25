resource "helm_release" "corporation_simulation" {
  name             = var.release_name
  namespace        = var.namespace
  create_namespace = true
  chart            = "../helm"

  values = [
    yamlencode({
      imagePullSecrets = [{ name = var.image_pull_secret_name }]
      secrets = {
        database    = var.database_secret_name
        application = var.application_secret_name
      }
      backend = {
        image = {
          tag = var.backend_image_tag
        }
      }
      frontend = {
        image = {
          tag = var.frontend_image_tag
        }
      }
    })
  ]
}
