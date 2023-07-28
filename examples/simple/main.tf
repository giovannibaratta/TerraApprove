resource "null_resource" "do_nothing" {
  triggers = {
    always_run = timestamp()
  }
}

resource "null_resource" "do_nothing_2" {
}
