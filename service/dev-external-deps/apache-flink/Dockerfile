FROM amazoncorretto:17 as builder

WORKDIR /workdir

COPY gradle gradle
COPY gradlew settings.gradle.kts ./

# Force gradle initialization to download gradle binaries and cache the layer
RUN ./gradlew --version

COPY app app

RUN ./gradlew jar


FROM flink:1.18.1-scala_2.12-java17

# Download the Kafka dependencies
RUN wget \
  https://repo1.maven.org/maven2/org/apache/flink/flink-connector-kafka/3.1.0-1.18/flink-connector-kafka-3.1.0-1.18.jar \
  -O /opt/flink/lib/flink-connector-kafka-3.1.0-1.18.jar

RUN wget \
  https://repo1.maven.org/maven2/org/apache/kafka/kafka-clients/3.1.0/kafka-clients-3.1.0.jar \
  -O /opt/flink/lib/kafka-clients-3.1.0.jar

COPY --from=builder /workdir/app/build/libs/app.jar /opt/flink/usrlib/EventToHttpConverter.jar
