import {Configuration} from "@libs/domain/configuration/configuration"
import {
  IConfigurationReader,
  ReadConfigurationError
} from "@libs/service/configuration/configuration-reader"
import {Injectable} from "@nestjs/common"
import {readFile, yamlToJson} from "../shared/file"
import {pipe} from "fp-ts/lib/function"
import {Either, chainW} from "fp-ts/lib/Either"
import {either} from "fp-ts"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"

@Injectable()
export class FileConfigurationReader implements IConfigurationReader {
  readConfiguration(
    location: string
  ): Either<ReadConfigurationError, Configuration> {
    const configuration = pipe(
      either.right(location),
      chainW(readFile),
      chainW(yamlToJson),
      chainW(this.validateConfiguration)
    )
    return configuration
  }

  private validateConfiguration(
    unsafeConfiguration: unknown
  ): Either<"invalid_configuration", Configuration> {
    const configurationValidator: ValidateFunction<Configuration> = new Ajv({
      allErrors: true,
      removeAdditional: true
    }).compile(configurationSchema)

    if (configurationValidator(unsafeConfiguration)) {
      return either.right(unsafeConfiguration)
    }

    return either.left("invalid_configuration")
  }
}

const configurationSchema: JSONSchemaType<Configuration> = {
  type: "object",
  // Remove additional props from the object to be validated
  additionalProperties: false
}
