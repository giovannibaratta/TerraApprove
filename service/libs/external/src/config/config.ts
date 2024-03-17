import {Injectable} from "@nestjs/common"

@Injectable()
export class Config {
  private dbConnectionUrl: string
  readonly kafkaConfig: KafkaConfig
  readonly s3Config: S3Config

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
    this.s3Config = this.readS3Config()
  }

  getDbConnectionUrl(): string {
    return this.dbConnectionUrl
  }

  private readS3Config(): S3Config {
    const rawS3Endpoint = process.env.S3_ENDPOINT
    const rawS3AccessKeyId = process.env.S3_ACCESS_KEY_ID
    const rawS3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY

    const rawS3BucketSourceCode = process.env.S3_BUCKET_SOURCE_CODE
    const rawS3BucketPlans = process.env.S3_BUCKET_PLANS

    if (rawS3Endpoint === undefined)
      throw new Error("S3_ENDPOINT is not defined")

    if (rawS3AccessKeyId === undefined)
      throw new Error("S3_ACCESS_KEY_ID is not defined")

    if (rawS3SecretAccessKey === undefined)
      throw new Error("S3_SECRET_ACCESS_KEY is not defined")

    if (rawS3BucketSourceCode === undefined)
      throw new Error("S3_BUCKET_SOURCE_CODE is not defined")

    if (rawS3BucketPlans === undefined)
      throw new Error("S3_BUCKET_PLANS is not defined")

    return {
      entpoint: rawS3Endpoint,
      accessKeyId: rawS3AccessKeyId,
      secretAccessKey: rawS3SecretAccessKey,
      buckets: {
        sourceCode: rawS3BucketSourceCode,
        plans: rawS3BucketPlans
      }
    }
  }
}

export interface KafkaConfig {
  readonly brokers: string[]
  readonly topics: {
    readonly runStatusChanged: string
  }
}

export interface S3Config {
  readonly entpoint: string
  readonly accessKeyId: string
  readonly secretAccessKey: string

  readonly buckets: {
    readonly sourceCode: string
    readonly plans: string
  }
}
