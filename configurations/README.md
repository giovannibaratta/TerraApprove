# Predefined configurations

This directory contains predefined configurations that can be used with TerraApprove. The following configurations are available:

`standard-mode.terraapprove.yaml` is meant to be used with the standard mode of TerraApprove. It requires approval for all resources that must be deleted or replaced during the apply.

`safe-to-apply.terraapprove.yaml` is meant to be used with the safe to apply (reverse) mode of TerraApprove. It consider safe resources that are created or update in places while require approval when resources are deleted.

## Usafe

Copy one of the files in this directory to the root of your Terraform project and rename it to `.terraapprove.yaml`.