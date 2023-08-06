resource "null_resource" "resource_in_root_module" {
}

module "noapproval" {
  source = "./modules/outer-module"
}

# @RequireApproval()
module "withapproval" {
  source = "./modules/outer-module"
}
