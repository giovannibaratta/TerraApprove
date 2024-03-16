package it.giovannibaratta;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.AsyncDataStream;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class EventToHttpConverter {

  public static void main(String[] args) throws Exception {

    ParameterTool parameters = ParameterTool.fromArgs(args);

    String kafkaBootstrapServers = parameters.getRequired("kafkaBootstrapServers");
    String[] kafkaTopics = parameters.getRequired("kafkaTopics").split(",");

    if (kafkaTopics.length < 1) {
      throw new IllegalArgumentException("At least one Kafka topic must be provided");
    }

    Map<String, String> kafkaTopicDestination = new HashMap<String, String>();

    for (String topic : kafkaTopics) {
      String destination = parameters.getRequired(topic);

      if(destination == null || destination.isEmpty()) {
        throw new IllegalArgumentException("Destination for topic " + topic + " must be provided");
      }

      kafkaTopicDestination.put(topic, destination);
    }

    AsyncHttpClient httpClient = new AsyncHttpClient(kafkaTopicDestination);

    final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

    KafkaSource<KafkaEvent> source = KafkaSource.<KafkaEvent>builder()
        .setBootstrapServers(kafkaBootstrapServers)
        .setTopics(kafkaTopics)
        .setStartingOffsets(OffsetsInitializer.latest())
        .setDeserializer(new KafkaDeserializer())
        .build();

    DataStream<KafkaEvent> stream = env.fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source");

    // The provided transformation does not retry in case of failed requests
    AsyncDataStream.unorderedWait(stream, httpClient, 1000, TimeUnit.MILLISECONDS, 100);

    // Print messages for debugging
    stream.print();

    env.execute("Kafka events to HTTP requests");
  }
}
