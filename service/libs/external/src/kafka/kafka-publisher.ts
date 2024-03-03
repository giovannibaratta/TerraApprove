import {Injectable} from "@nestjs/common"
import {Kafka, Partitioners} from "kafkajs"
import {Config} from "../config/config"

@Injectable()
export class KafkaPublisher {
  private readonly kafka: Kafka

  constructor(readonly config: Config) {
    this.kafka = new Kafka({
      clientId: "terraapprove-publisher",
      brokers: config.kafkaConfig.brokers,
      retry: {
        retries: 2
      },
      connectionTimeout: 5000
    })
  }

  async publish(topic: string, message: string) {
    /* Possible improvements: cache the producers instead of creating a new
    one for each message to publish */
    const producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner
    })
    await producer.connect()
    await producer.send({
      topic,
      messages: [{value: message}]
    })
    await producer.disconnect()
  }
}
