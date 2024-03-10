package it.giovannibaratta;

import java.nio.charset.StandardCharsets;

import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema;
import org.apache.kafka.clients.consumer.ConsumerRecord;

public class KafkaDeserializer implements
    KafkaRecordDeserializationSchema<KafkaEvent> {

  @Override
  public TypeInformation<KafkaEvent> getProducedType() {
    return TypeInformation.of(KafkaEvent.class);
  }

  @Override
  // Given a Kafka record, extract the topic and the value and build a KafkaEvent
  public void deserialize(ConsumerRecord<byte[], byte[]> record, org.apache.flink.util.Collector<KafkaEvent> out) {
    String topic = record.topic();
    String value = new String(record.value(), StandardCharsets.UTF_8);
    KafkaEvent event = new KafkaEvent(topic, value);
    out.collect(event);
  }
}
