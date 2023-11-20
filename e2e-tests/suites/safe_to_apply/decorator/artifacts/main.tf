resource "null_resource" "do_nothing" {
  triggers = {}
}

# @SafeToApply()
resource "null_resource" "safe_tp_apply" {
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