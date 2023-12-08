// eslint-disable-next-line node/no-unpublished-import
import {Chance} from "chance"

interface Resource extends ResourceIdentifier {
  resourceAddress: string
}

interface ResourceIdentifier {
  resourceType: string
  resourceName: string
}

const randomGenerator = new Chance()

export function generateTerraformResource(
  partial?: Partial<ResourceIdentifier>
): Resource {
  const defaultValues: ResourceIdentifier = {
    resourceType: randomGenerator.word(),
    resourceName: randomGenerator.word()
  }

  const resourceIdentifier = {
    ...defaultValues,
    ...partial
  }

  return {
    ...resourceIdentifier,
    resourceAddress: `${resourceIdentifier.resourceType}.${resourceIdentifier.resourceName}`
  }
}
