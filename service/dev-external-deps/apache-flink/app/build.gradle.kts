plugins {
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.guava)
    compileOnly("org.apache.flink:flink-core:1.18.1")
    compileOnly("org.apache.flink:flink-streaming-java:1.18.1")
    implementation("org.apache.flink:flink-connector-kafka:3.1.0-1.18")
    implementation("org.apache.flink:flink-connector-base:1.18.1")
    implementation("org.apache.kafka:kafka_2.13:3.1.0")
    implementation("org.apache.kafka:kafka-clients:3.1.0")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

application {
    mainClass = "it.giovannibaratta.EventToHttpConverter"
}

tasks.jar {
    manifest {
        attributes(
                "Main-Class" to "it.giovannibaratta.EventToHttpConverter"
        )
    }
}