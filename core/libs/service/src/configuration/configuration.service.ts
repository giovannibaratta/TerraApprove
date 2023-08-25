import {Inject, Injectable, Logger} from "@nestjs/common"
import {
  CONFIGURATION_READER,
  IConfigurationReader
} from "./configuration-reader"
import {Configuration} from "@libs/domain/configuration/configuration"
import {isLeft} from "fp-ts/lib/Either"

@Injectable()
export class ConfigurationService {
  private configuration: Configuration | undefined

  constructor(
    @Inject(CONFIGURATION_READER)
    private readonly configurationReader: IConfigurationReader
  ) {}

  readConfiguration(location: string): void {
    const eitherConfiguration =
      this.configurationReader.readConfiguration(location)

    if (isLeft(eitherConfiguration)) {
      Logger.error(`Unable to read configuration: ${eitherConfiguration.left}`)
      throw new Error(
        `Unable to read configuration: ${eitherConfiguration.left}`
      )
    }

    this.configuration = eitherConfiguration.right

    Logger.debug(`Configuration: ${JSON.stringify(this.configuration)}`)
  }
}
