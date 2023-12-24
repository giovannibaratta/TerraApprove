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

@test "should return 0 if the plan contains actions that create and update resources" {
  # Given
  terraform plan -out test.tfplan -var=revision=1 > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json"

  # Expect
  [ "$status" -eq 0 ]
  grep "Approval required: false" <<< "$output"

  # Given
  terraform apply -auto-approve -var=revision=1 > /dev/null
  # Should trigger an update in place
  terraform plan -out test.tfplan -var=revision=2 > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json"

  # Expect
  [ "$status" -eq 0 ]
  grep "Approval required: false" <<< "$output"
}