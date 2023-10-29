# Even if no decorator is applied to this resource,
# if we run the application it should say that an approval is required
# because we defined a global rule.
resource "null_resource" "do_nothing" {
  triggers = {
    always_run = timestamp()
  }
}