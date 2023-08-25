import {Configuration} from "@libs/domain/configuration/configuration"
import {Either} from "fp-ts/lib/Either"

export interface IConfigurationReader {
  readConfiguration(
    location: string
  ): Either<ReadConfigurationError, Configuration>
}

export type ReadConfigurationError =
  | "resource_not_found"
  | "invalid_configuration"
  | "invalid_resource"
export const CONFIGURATION_READER = "CONFIGURATION_READER"
