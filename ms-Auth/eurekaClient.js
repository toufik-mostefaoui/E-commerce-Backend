import { Eureka } from 'eureka-js-client';

const client = new Eureka({
    instance: {
        app: 'ms-auth',
        instanceId: 'ms-auth',
        hostName: 'localhost',//ms-auth
        ipAddr: '127.0.0.1',//ms-auth
        statusPageUrl: 'http://localhost:5000/info',//ms-auth:5000/info
        port: {
            '$': 5000,
            '@enabled': 'true'
        },
        vipAddress: 'ms-auth',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn'
        }
    },
    eureka: {
        host: 'localhost',//'localhost', // Use the service name from docker-compose
        port: 8888,
        servicePath: '/eureka/apps/',
        maxRetries: 10,              
        requestRetryDelay: 5000
    }

});


client.start(error => {
    if (error) {
        console.error('Error registering with Eureka:', error);
    } else {
        console.log('successfully registered with Eureka!');
    }
});

export default client;
