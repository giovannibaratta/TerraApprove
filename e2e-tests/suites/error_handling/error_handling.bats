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

@test "should return 2 if the plan does not exist" {
  # When
  run "/code/terraapprove" "." "./test.tfplan.json"

  # Expect
  [ "$status" -ge 2 ]
  grep "Error while reading plan" <<< "$output"
}

@test "should return 2 if the code base does not exist" {
  #Given
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "/tmp/notexist" "./test.tfplan.json"

  # Expect
  [ "$status" -ge 2 ]
  grep "Error while reading code base" <<< "$output"
}