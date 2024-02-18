import {Controller, Get, Injectable, Logger, Post} from "@nestjs/common"
import {randomUUID} from "crypto"
import {Kafka, Partitioners} from "kafkajs"

@Controller()
export class KafkaController {
  constructor() {
    console.log("KafkaController constructor")
  }

  @Post("kafka")
  async postKafka() {
    const kafka = new Kafka({
      clientId: "my-app",
      brokers: ["localhost:9092"],
      retry: {
        retries: 1
      }
    })

    const producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner
    })

    await producer.connect()
    await producer.send({
      topic: "test-3",
      messages: [{value: `Hello KafkaJS user! ${randomUUID()}`}]
    })

    return ""
  }

  @Get("kafka")
  async getKafka() {
    const kafka = new Kafka({
      clientId: "my-app",
      brokers: ["localhost:9092"],
      retry: {
        retries: 1
      }
    })

    const consumer = kafka.consumer({
      groupId: randomUUID()
    })

    await consumer.connect()
    await consumer.subscribe({topic: "test-3", fromBeginning: true})

await consumer.
    
    await consumer.run({
      eachMessage: async ({topic, partition, message}) => {
        Logger.log({
          topic,
          partition,
          offset: message.offset,
          value: message.value!!.toString()
        })
      }
    })

    return ""
  }
}
