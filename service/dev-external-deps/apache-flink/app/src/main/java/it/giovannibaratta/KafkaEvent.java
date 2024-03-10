package it.giovannibaratta;

public class KafkaEvent {

  public final String topic;
  public final String value;

  public KafkaEvent(String topic, String value) {
    this.topic = topic;
    this.value = value;
  }

  @Override
  public String toString() {
    return "KafkaEvent{" +
        "topic='" + topic + '\'' +
        ", value='" + value + '\'' +
        '}';
  }
}