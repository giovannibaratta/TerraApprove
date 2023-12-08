resource "null_resource" "not_safe_to_apply" {
}

resource "local_file" "safe_to_apply" {
  content  = "foo!"
  filename = "${path.module}/foo.bar"
}

resource "local_sensitive_file" "safe_to_apply" {
  content  = "bar!"
  filename = "${path.module}/bar.bar"
}

terraform {
  required_providers {
    null = {
      source = "hashicorp/null"
    }

    local = {
      source = "hashicorp/local"
    }
  }
}