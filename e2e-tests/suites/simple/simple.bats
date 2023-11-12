setup() {
  # Copy files to a read/write directory. This is necessary because
  # Terraform generates a lock file in the working directory.
  cp -r "$BATS_TEST_DIRNAME/artifacts/." $BATS_TEST_TMPDIR
  export TF_DATA_DIR="${BATS_TEST_TMPDIR}"
  terraform -chdir=$BATS_TEST_TMPDIR init > /dev/null
}

teardown() {
  TF_DATA_DIR=

  # Print additional information when a test fails
  echo "$status"
  echo "$output"
}

@test "should return 1 if the plan requires approval" {
  # Given
  terraform -chdir=$BATS_TEST_TMPDIR plan -out "${BATS_TEST_TMPDIR}/test.tfplan" > /dev/null
  terraform -chdir=$BATS_TEST_TMPDIR show -json "${BATS_TEST_TMPDIR}/test.tfplan" > "${BATS_TEST_TMPDIR}/test.tfplan.json"

  # When
  run "/code/terraapprove" "${BATS_TEST_TMPDIR}" "${BATS_TEST_TMPDIR}/test.tfplan.json"

  # Expect
  [ "$status" -eq 1 ]
}