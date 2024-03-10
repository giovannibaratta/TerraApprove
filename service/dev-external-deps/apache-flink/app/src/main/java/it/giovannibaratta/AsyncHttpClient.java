package it.giovannibaratta;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Supplier;

import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;

class AsyncHttpClient extends RichAsyncFunction<KafkaEvent, KafkaEvent> {

  private Map<String, String> eventRouting;
  private HttpClient client;

  public AsyncHttpClient(Map<String, String> eventRouting) {
    this.eventRouting = eventRouting;
  }

  @Override
  public void open(Configuration parameters) throws Exception {
    client = HttpClient.newHttpClient();
  }

  @Override
  public void asyncInvoke(KafkaEvent event, final ResultFuture<KafkaEvent> resultFuture) throws Exception {

    String destination = eventRouting.get(event.topic);

    HttpRequest request = HttpRequest.newBuilder()
        .POST(HttpRequest.BodyPublishers.ofString(event.value))
        .uri(URI.create(destination))
        .build();

    CompletableFuture<HttpResponse<String>> responseFuture = client.sendAsync(request,
        HttpResponse.BodyHandlers.ofString());

    CompletableFuture.supplyAsync(new Supplier<KafkaEvent>() {
      @Override
      public KafkaEvent get() {
        try {
          HttpResponse<String> result = responseFuture.get();
          System.out.println("Sent request to " + destination + ". Result status code " + result.statusCode());
          return event;
        } catch (InterruptedException | ExecutionException e) {
          System.out.println("Error while performing request");
          return null;
        }
      }
    }).thenAccept((KafkaEvent value) -> {
      resultFuture.complete(Collections.singleton(value));
    });
  }
}
