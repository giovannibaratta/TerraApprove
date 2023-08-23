# @RequireApproval()
resource "null_resource" "do_nothing" {
  triggers = {
    //always_run = timestamp()
  }
}

# @RequireApproval({matchActions: ["CREATE"]})
resource "null_resource" "do_nothing_2" {
}

# The delete action can be used with resources
# that should be replaced (and not deleted since they
# will not be part of the code base anymore).
# @RequireApproval({matchActions: ["DELETE"]})
resource "null_resource" "do_nothing_3" {
}
