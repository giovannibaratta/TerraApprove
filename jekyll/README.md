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
   # From the main directory
   ./artifacts/terraapprove ./examples/simple ./examples/simple/tfplan.json
   ```

3. Inspect the exit code to know if the plan can be applied with `-auto-approve` or if a manual approval is required.

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

| Argument       | Description                                                                                                                            | Default behavior              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `matchActions` | A list of actions that must be matched for the decorator to be applied. The possible values are `CREATE`, `UPDATE_IN_PLACE`, `DELETE`. | All actions requires approval |

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

## Alternatives

This is a list of alternative tools (definitely more mature than TerraApprove) that can be used to achieve the same (or similar) results:

- https://www.openpolicyagent.org/docs/latest/terraform/
