import {Configuration} from "@libs/domain/configuration/configuration"
import {Inject, Injectable, Logger} from "@nestjs/common"
import {isLeft} from "fp-ts/lib/Either"
import {
  CONFIGURATION_READER,
  IConfigurationReader
} from "./configuration-reader"

const DEFAULT_CONFIGURATION: Configuration = {
  requireApprovalItems: [],
  global: {
    requireApprovalActions: []
  }
}

@Injectable()
export class ConfigurationService {
  constructor(
    @Inject(CONFIGURATION_READER)
    private readonly configurationReader: IConfigurationReader
  ) {}

  readConfiguration(location: string): Configuration {
    const eitherConfiguration =
      this.configurationReader.readConfiguration(location)

    if (isLeft(eitherConfiguration)) {
      Logger.debug(`Unable to read configuration: ${eitherConfiguration.left}`)
      if (eitherConfiguration.left === "resource_not_found") {
        Logger.debug(`Configuration not found at ${location}`)

        return DEFAULT_CONFIGURATION
      }

      Logger.error(
        `Unprocessable error while trying to read configuration: ${eitherConfiguration.left}`
      )
      throw new Error(
        `Unable to read configuration: ${eitherConfiguration.left}`
      )
    }

    const configuration = eitherConfiguration.right
    Logger.debug(`Configuration: ${JSON.stringify(configuration)}`)
    return configuration
  }
}
