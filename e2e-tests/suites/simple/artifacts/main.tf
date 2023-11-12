# @RequireApproval()
resource "null_resource" "do_nothing" {
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
