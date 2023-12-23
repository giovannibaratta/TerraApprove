<div style="display: flex; align-items: center; margin-bottom: 18px">
  <div>
    <img src="./artifacts/terrapprove-ai-generated-logo.png"  width="150" height="150" alt="logo generated with https://www.freepik.com/ai/images">
    <p style="font-size: 0.5em;
    font-style: italic;
      font-weight: lighter;
      margin-top: 0;">
    Image generated with https://www.freepik.com/ai/images
    </p>
  </div>
    <p style="font-size: 2em;
      font-weight: bold;
      margin-top: 0; margin-left: 48px">
    TerraApprove
    </p>
</div>

TerraApprove is a tool that can be integrated in a CI/CD pipeline and can be used to reduce the risk of applying a Terraform plan that can cause undesired changes. All the resources that require special attention (e.g. stateful resources) can be tagged with a decorator. TerraApprove will then check if the plan contains any of these resources and will produce an output that can be used to decide if the plan can be applied with `-auto-approve` or if manual approval is required.

> :warning: It's up to the user to implement the necessary logic to ask the user for approval.

A GitHub Action is also provided to simplify the integration in a GitHub workflow. See [here](https://github.com/marketplace/actions/terraapprove) for more details.

## Usage

1. You need a Terraform code base and the relative Terraform plan. The Terraform plan must be in JSON format.

   ```bash
   cd examples/simple
   terraform init
   terraform plan -out=tfplan
   terraform show -json tfplan > tfplan.json
   ```

2. Run the application specifying the path to the Terraform codebase & plan.

   ```bash
   terraapprove ./examples/simple ./examples/simple/tfplan.json
   ```

3. Inspect the exit code to know if the plan can be applied with `-auto-approve` or if a manual approval is required.

## Operating modes

The application supports two operating modes:
* Standard mode, this is the default mode.
* Safe to apply mode, can be enabled using the flag `--reverse`.

### Standard mode

In this mode, all the resources are considered **safe** to apply by default except the ones that are tagged with `RequireApproval` or are specified in the global rules.

### Safe to apply mode

In this mode, all the resources are considered **unsafe** by default to apply except the ones that are tagged with `SafeToApply` or are specified in the global rules.

## RequireApproval decorator

The `RequireApproval` decorator can be used to mark a resource that requires manual approval. The decorator can be used as follows:

```hcl
# RequireApproval()
resource "aws_instance" "example" {
  ...
}
```

:memo: The decorator must be placed between the previous resource (the line following the closing bracket `}` ) and the declaration of resource that must be protected. The decorator can be used on any resource type or modules (expect for data).

### Decorator arguments

The decorator accepts arguments to customize the behavior. The arguments are specified as a JSON object. The following arguments are supported:

| Argument       | Description                                                                                                                            | If not set              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `matchActions` | A list of actions that must be matched for the decorator to be applied. The possible values are `CREATE`, `UPDATE_IN_PLACE`, `DELETE`. | All actions require approval |

Example:

```hcl
# RequireApproval({ matchActions: ["CREATE"]})
resource "aws_instance" "example" {
  ...
}
```

### How to handle approval for deleted resources

Deleted resources might not be part of the code base, hence we need another way to protect them. These resources can be protected specifying the fully qualified address in a file named `.terraapprove.yaml`. The file must be placed in the root folder of the codebase.

```yaml
requireApproval:
  - fullyQualifiedAddress: "null_resource.do_nothing_2"
    actions: ["DELETE"]
```

## SafeToApply decorator

The `SafeToApply` decorator can be used to mark a resource that is safe to apply. If the resource is found in the plan, the application will not consider it as a resource that requires approval. If the plan contains only resources that are safe to apply, the application will exit with code `0`. This might be useful if the code base contains resource that changes often and even if they are misconfigured do not produce any harm.

The decorator can be used as follows:

```hcl
# SafeToApply()
resource "aws_instance" "example" {
  ...
}
```

### Decorator arguments

The decorator accepts arguments to customize the behavior. The arguments are specified as a JSON object. The following arguments are supported:

| Argument       | Description                                                                                                                            | If not set              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `matchActions` | A list of actions that must be matched for the decorator to be applied. The possible values are `CREATE`, `UPDATE_IN_PLACE`, `DELETE`. | All actions are safe to apply |

Example:

```hcl
# SafeToApply({ matchActions: ["CREATE"]})
resource "aws_instance" "example" {
  ...
}
```

## Global rules

The application supports global rules that affect all the resources in the code base without the need to mark all the resources with a decorator. The rules must be added to the `.terraapprove.yaml` file in the root folder of the codebase.

The supported rules are:
* matching a list of actions
* matching a list of provider types

### Matching actions in standard mode

When using the standard mode, the `requireApproval.allResource.actions` parameter can be used to specify the list of actions that always require approval. If in the plan there is at least one resource that specify on the action listed in the parameter, the application will exit with code `1` indicating that an approval is required.

```yaml
.terraapprove.yaml

global:
  requireApproval:
    allResources:
      actions: # Supported values are "CREATE", "UPDATE_IN_PLACE", "DELETE"
        - "DELETE"
```

### Matching actions in safe to apply mode

When using the safe to apply mode, the `safeToApply.allResource.actions` parameter can be used to specify the list of actions that are always safe to apply. If in the plan there are only resources that specify the action listed in the parameter, the application will exit with code `0` indicating that the plan can be applied with `-auto-approve`.

```yaml
.terraapprove.yaml

global:
  safeToApply:
    allResources:
      actions: # Supported values are "CREATE", "UPDATE_IN_PLACE", "DELETE"
        - "CREATE"
```

### Matching provider types in standard mode

When using the standard mode, the `requireApproval.allResources.matchers` parameter can be used to specify the list of provider types that always require approval. If in the plan there is at least one resource of the type specified in list, the application will exit with code `1` indicating that an approval is required.

```yaml
.terraapprove.yaml

global:
  requireApproval:
    allResources:
      matchers:
        - providerType: "google_storage_bucket"
```

### Matching provider types in safe to apply mode

When using the safe to apply mode, the `safeToApply.allResources.matchers` parameter can be used to specify the list of provider types that are always safe to apply. If in the plan there are only resources of the types specified in list, the application will exit with code `0` indicating that an approval is not required.

```yaml
.terraapprove.yaml

global:
  safeToApply:
    allResources:
      matchers:
        - providerType: "google_storage_bucket"
```

## Alternatives

This is a list of alternative tools (definitely more mature than TerraApprove) that can be used to achieve the same (or similar) results:

- https://www.openpolicyagent.org/docs/latest/terraform/
- https://www.runatlantis.io/