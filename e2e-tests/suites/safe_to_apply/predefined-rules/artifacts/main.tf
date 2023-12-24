resource "null_resource" "safe_to_create" {}

variable "revision" {
  type = number
}

resource "terraform_data" "safe_to_update_in_place" {
  input = var.revision
}

terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }
  }
}
