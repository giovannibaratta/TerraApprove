import {File} from "../file/file"

export interface TerraformResource {
  readonly file: string
  readonly type: string
  readonly name: string
  readonly requireApproval: boolean
}

// Regex that matches the pattern resource "resource type" "resource name" {
const resourceRegex = /resource +"([^"]+)" +"([^"]+)" +{/

// This function finds all the terraform resources defined in a file
// and returns them as an array of TerraformResource
export function findTerraformResourcesInFile(file: File): TerraformResource[] {
  const {lines} = file
  const resources: TerraformResource[] = []

  for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex++) {
    const match = lines[lineIndex].match(resourceRegex)

    if (match) {
      const resourceType = match[1]
      const resourceName = match[2]

      const requireApproval =
        // If the first line of the file contains a terraform resource, it means that it can't require approval
        lineIndex > 0 && doesLinesContainsApprovalTag(lines[lineIndex - 1])

      resources.push({
        file: file.name,
        type: resourceType,
        name: resourceName,
        requireApproval
      })
    }
  }

  return resources
}

// Regex that matches the pattern # @RequireApproval()
// The decorator must be defined inside a comment otherwise
// it will not be terraform compliant
const requireApprovalRegex = /^# *@RequireApproval\(\) *$/

function doesLinesContainsApprovalTag(line: string): boolean {
  return line.match(requireApprovalRegex) !== null
}
