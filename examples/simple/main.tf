# @RequireApproval()
resource "null_resource" "do_nothing" {
  triggers = {
    always_run = timestamp()
  }
}

# This approval is placed on other line
# @RequireApproval()
# This is an extra comment. It is useless ;)
resource "null_resource" "do_nothing_2" {
}
