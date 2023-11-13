resource "null_resource" "untagged_resource" {
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
