package it.giovannibaratta;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class EventToHttpConverter {

  public static void main(String[] args) throws Exception {

    ParameterTool parameters = ParameterTool.fromArgs(args);

    String kafkaBootstrapServers = parameters.getRequired("kafkaBootstrapServers");
    String kafkaTopic = parameters.getRequired("kafkaTopic");

    final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

    KafkaSource<String> source = KafkaSource.<String>builder()
        .setBootstrapServers(kafkaBootstrapServers)
        .setTopics(kafkaTopic)
        .setGroupId("flink")
        .setStartingOffsets(OffsetsInitializer.earliest())
        .setValueOnlyDeserializer(new SimpleStringSchema())
        .build();

    DataStream<String> stream = env.fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source");

    // Print each event to the console
    stream.print();

    env.execute("Kafka events to HTTP requests");
  }
}
