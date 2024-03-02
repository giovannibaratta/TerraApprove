import {Injectable} from "@nestjs/common"

@Injectable()
export class Config {
  private dbConnectionUrl: string
  readonly kafkaBrokers: string[]

  constructor() {
    const connectionUrl = process.env.DATABASE_URL

    if (connectionUrl === undefined)
      throw new Error("DATABASE_URL is not defined")

    this.dbConnectionUrl = connectionUrl

    const rawKafkaBrokers = process.env.KAFKA_BROKERS

    if (rawKafkaBrokers === undefined)
      throw new Error("KAFKA_BROKERS is not defined")

    this.kafkaBrokers = rawKafkaBrokers.split(",")
  }

  getDbConnectionUrl(): string {
    return this.dbConnectionUrl
  }
}
