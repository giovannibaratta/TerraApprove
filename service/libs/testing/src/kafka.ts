import {KafkaConfig} from "@libs/external/config/config"
import {randomUUID} from "crypto"
import {Kafka, logLevel} from "kafkajs"

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
    topics: [{topic}],
    waitForLeaders: true
  })
  await admin.disconnect()
}

export async function cleanKafka(config: KafkaConfig): Promise<void> {
  const client = new Kafka({
    brokers: config.brokers,
    logLevel: logLevel.ERROR
  })

  const admin = client.admin()
  await admin.connect()
  await admin.deleteTopics({
    topics: [config.topics.runStatusChanged]
  })
  await createTopic(config.brokers.join(","), config.topics.runStatusChanged)
  await admin.disconnect()
}

export async function readMessagesFromKafka(
  config: KafkaConfig,
  topic: string
): Promise<ReadonlyArray<string>> {
  const client = new Kafka({
    brokers: config.brokers,
    logLevel: logLevel.ERROR
  })

  const consumer = client.consumer({
    groupId: `test-${randomUUID()}`
  })

  await consumer.connect()
  await consumer.subscribe({topic, fromBeginning: true})

  const messages: string[] = []

  await consumer.run({
    eachMessage: async ({message}) => {
      messages.push(message.value?.toString() ?? "")
    }
  })

  // Block the execution until at least one message has been receveid
  // eslint-disable-next-line no-async-promise-executor
  await new Promise<void>(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject("Timeout reached. No message received from Kafka")
    }, 5000)

    while (messages.length === 0) {
      // Sleep for a while
      await new Promise(resolveSleep => {
        setTimeout(resolveSleep, 100)
      })
    }

    clearTimeout(timeoutId)
    resolve()
  })

  await consumer.disconnect()

  return [...messages]
}
