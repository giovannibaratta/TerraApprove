setup() {
  # Copy files to a read/write directory. This is necessary because
  # Terraform generates a lock file in the working directory.
  export ORIGINAL_DIR=$(pwd)
  cp -r "$BATS_TEST_DIRNAME/artifacts/." $BATS_TEST_TMPDIR
  cd $BATS_TEST_TMPDIR
  terraform init > /dev/null
}

teardown() {
  cd $ORIGINAL_DIR

  # Print additional information when a test fails
  echo "$status"
  echo "$output"
}

@test "should return 0 if the only resources in the plan are safe to apply" {
  # Given
  terraform apply -auto-approve > /dev/null

  # Delete files to trigger re-creation of the resource
  rm ${BATS_TEST_TMPDIR}/foo.bar
  rm ${BATS_TEST_TMPDIR}/bar.bar

  # A second apply should only trigger the re-creation of the files
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json" "--reverse"

  # Expect
  [ "$status" -eq 0 ]
  # Sanity check
  grep "Operating mode: reverse" <<< "$output"
}