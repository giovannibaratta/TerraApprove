resource "null_resource" "not_safe_to_delete" {
  triggers = {
    always_run = timestamp()
  }
}

terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }
  }
}
