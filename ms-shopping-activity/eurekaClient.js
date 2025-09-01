import { Eureka } from "eureka-js-client";

const client = new Eureka({
  instance: {
    app: "ms-shopping-activity",
    instanceId: "ms-shopping-activity",
    hostName: "localhost",  //ms-ms-shopping-activity
    ipAddr: "127.0.0.1", //ms-ms-shopping-activity
    statusPageUrl: "http://localhost:5001/info", //ms-product:5000/info
    port: {
      $: 5002,
      "@enabled": "true",
    },
    vipAddress: "ms-shopping-activity",
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
  },
  eureka: {
    host: "localhost", //'localhost', // Use the service name from docker-compose
    port: 8888,
    servicePath: "/eureka/apps/",
    maxRetries: 10,
    requestRetryDelay: 5000,
  },
});

client.start((error) => {
  if (error) {
    console.error("Error registering with Eureka:", error);
  } else {
    console.log("successfully registered with Eureka!");
  }
});