import { Eureka } from "eureka-js-client";

const client = new Eureka({
  instance: {
    app: "ms-products",
    instanceId: "ms-products",
    hostName: "localhost",  //ms-products
    ipAddr: "127.0.0.1", //ms-products
    statusPageUrl: "http://localhost:5001/info", //ms-product:5000/info
    port: {
      $: 5001,
      "@enabled": "true",
    },
    vipAddress: "ms-products",
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

export default client;
