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
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json" "--reverse"

  # Expect
  [ "$status" -eq 0 ]
  # Sanity checks
  grep "Operating mode: reverse" <<< "$output"
  grep "Approval required: false" <<< "$output"
}

@test "should return 1 if not all the actions are matched by the global matcher" {
  # Given
  terraform apply -auto-approve > /dev/null

  # A second apply should only trigger the re-creation of the files
  terraform plan -out test.tfplan -var 'foo_content=bar'> /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json" "--reverse" "--debug"

  # Expect
  [ "$status" -eq 1 ]
  # Sanity checks
  grep "Operating mode: reverse" <<< "$output"
  grep "Approval required: true" <<< "$output"
}