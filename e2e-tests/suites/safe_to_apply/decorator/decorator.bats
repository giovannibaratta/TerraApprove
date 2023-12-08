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

@test "should return 1 if the plan contains resources that are not safe to apply" {
  # Given

  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json" "--reverse"

  # Expect
  [ "$status" -eq 1 ]
  # Sanity check
  grep "Operating mode: reverse" <<< "$output"
}

@test "should return 0 if the only resource in the plan is safe to apply" {
  # Given

  # During first apply two resources should be added
  terraform apply -auto-approve > /dev/null

  # During second plan only the resource with SafeToApply decorator should be present
  terraform plan -out test.tfplan > /dev/null
  terraform show -json test.tfplan > ${BATS_TEST_TMPDIR}/test.tfplan.json

  # When
  run "/code/terraapprove" "." "./test.tfplan.json" "--reverse"

  # Expect
  [ "$status" -eq 0 ]
  # Sanity check
  grep "Operating mode: reverse" <<< "$output"
}