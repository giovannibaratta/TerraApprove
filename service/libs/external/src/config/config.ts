import {Injectable} from "@nestjs/common"

@Injectable()
export class Config {
  private dbConnectionUrl: string
  readonly kafkaConfig: KafkaConfig

  constructor() {
    const connectionUrl = process.env.DATABASE_URL

    if (connectionUrl === undefined)
      throw new Error("DATABASE_URL is not defined")

    this.dbConnectionUrl = connectionUrl

    const rawKafkaBrokers = process.env.KAFKA_BROKERS
    const rawKafkaTopicRunStatusChanged =
      process.env.KAFKA_TOPIC_RUN_STATUS_CHANGED

    if (rawKafkaBrokers === undefined)
      throw new Error("KAFKA_BROKERS is not defined")

    if (
      rawKafkaTopicRunStatusChanged === undefined ||
      rawKafkaTopicRunStatusChanged === ""
    )
      throw new Error("KAFKA_TOPIC_RUN_STATUS_CHANGED is not defined")

    const kafkaConfig = {
      brokers: rawKafkaBrokers.split(","),
      topics: {
        runStatusChanged: rawKafkaTopicRunStatusChanged
      }
    }

    this.kafkaConfig = kafkaConfig
  }

  getDbConnectionUrl(): string {
    return this.dbConnectionUrl
  }
}

export interface KafkaConfig {
  readonly brokers: string[]
  readonly topics: {
    readonly runStatusChanged: string
  }
}
