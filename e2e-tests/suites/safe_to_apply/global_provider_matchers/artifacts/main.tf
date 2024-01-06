resource "local_file" "safe_to_apply" {
  content  = var.foo_content
  filename = "${path.module}/foo.bar"
}

terraform {
  required_providers {
    local = {
      source = "hashicorp/local"
    }
  }
}

variable "foo_content" {
  type    = string
  default = "foo!"
}
