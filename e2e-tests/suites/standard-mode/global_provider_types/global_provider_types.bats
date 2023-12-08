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

@test "should return 1 if there are types that require approval" {
  # Given
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json"

  # Expect
  [ "$status" -eq 1 ]
  grep "Approval required: true" <<< "$output"

  # Given
  terraform apply -auto-approve > /dev/null

  # A second apply should only trigger the re-creation of the null_resource
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json"

  # Expect
  [ "$status" -eq 0 ]
  grep "Approval required: false" <<< "$output"
}