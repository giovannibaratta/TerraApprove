import {Injectable, OnModuleDestroy, OnModuleInit} from "@nestjs/common"
import {Kafka, Partitioners, Producer} from "kafkajs"
import {Config} from "../config/config"

@Injectable()
export class KafkaPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly producer: Producer

  constructor(readonly config: Config) {
    const kafka = new Kafka({
      clientId: "terraapprove-publisher",
      brokers: config.kafkaConfig.brokers,
      retry: {
        retries: 2
      },
      connectionTimeout: 5000
    })

    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner
    })
  }

  async onModuleInit() {
    await this.producer.connect()
  }

  async publish(topic: string, message: string) {
    await this.producer.send({
      topic,
      messages: [{value: message}]
    })
  }

  async onModuleDestroy() {
    await this.producer.disconnect()
  }
}
