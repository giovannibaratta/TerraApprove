import {KafkaConfig} from "@libs/external/config/config"
import {randomUUID} from "crypto"
import {Kafka} from "kafkajs"

export async function prepareKafka(): Promise<KafkaConfig> {
  const rawKafkaBrokers = process.env.KAFKA_BROKERS

  if (rawKafkaBrokers === undefined)
    throw new Error("KAFKA_BROKERS is not defined")

  const rawKafkaTopicRunStatusChanged = `run-status-changed-${randomUUID()}`

  await createTopic(rawKafkaBrokers, rawKafkaTopicRunStatusChanged)

  return {
    brokers: rawKafkaBrokers.split(","),
    topics: {
      runStatusChanged: rawKafkaTopicRunStatusChanged
    }
  }
}

async function createTopic(brokers: string, topic: string) {
  const client = new Kafka({
    brokers: brokers.split(",")
  })

  const admin = client.admin()
  await admin.connect()
  await admin.createTopics({
    topics: [{topic}]
  })
  await admin.disconnect()
}

export async function cleanKafka(config: KafkaConfig): Promise<void> {
  const client = new Kafka({
    brokers: config.brokers
  })

  const admin = client.admin()
  await admin.connect()
  await admin.deleteTopics({
    topics: [config.topics.runStatusChanged]
  })
  await createTopic(config.brokers.join(","), config.topics.runStatusChanged)
  await admin.disconnect()
}
