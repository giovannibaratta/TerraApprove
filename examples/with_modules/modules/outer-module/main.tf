resource "null_resource" "resource_in_outer_module" {
}

module "nested_module" {
  source = "../nested-module"
}
