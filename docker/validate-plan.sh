# Validate input variables
: ${INPUT_TF_CODE_DIR?"The environment variable 'INPUT_TF_CODE_DIR' is not set."}
: ${INPUT_TF_PLAN_JSON_FILE?"The environment variable 'INPUT_TF_PLAN_JSON_FILE' is not set."}

INPUT_MODE=${INPUT_MODE:-"standard"}

if [ "$INPUT_MODE" == "standard" ]; then
  flag_mode="--standard"
elif [ "$INPUT_MODE" == "safe_to_apply" ]; then
  flag_mode="--reverse"
else
  echo "Error: The environment variable 'INPUT_MODE' has an invalid value."
  exit 1
fi

# Setup output
# If we are running in a GitHub Action, write to the GitHub Action output
OUTPUT="${GITHUB_OUTPUT:-/dev/stdout}"

# Execute TerraApprove
/app/terraapprove "${INPUT_TF_CODE_DIR}" "${INPUT_TF_PLAN_JSON_FILE}" ${flag_mode} > /dev/null

# Evaluate the exit code
exit_code=$?

if [ $exit_code -eq 0 ]; then
  # No approval is required
  echo "approval_required=false" >> $OUTPUT
  exit 0
elif [ $exit_code -eq 1 ]; then
  # Approval is required
  echo "approval_required=true" >> $OUTPUT
  exit 0
else
  # TerraApprove exited with an error. Propagate the error.
  exit 1
fi
