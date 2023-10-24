# If we have a plan that contains this resource,
# the application should safe that the approval is not required

# @SafeToApply()
resource "null_resource" "do_nothing" {
}
