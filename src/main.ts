import { Eureka } from 'eureka-js-client';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const PORT = process.env.PORT || 9000;
  // Start the Nest app
  await app.listen(PORT);
  console.log(`Product microservice is running on http://localhost:${PORT}`);

  // Initialize the Eureka client
  const client = new Eureka({
    instance: {
      // Name of this app (as it should appear in Eureka)
      app: 'sso-user-microservice',

      // Unique instance ID - you can combine your app name + port, for example
      instanceId: `sso-user-microservice-${PORT}`,

      // The hostname or IP that your service will be accessed by
      hostName: 'localhost',
      ipAddr: '127.0.0.1',

      port: {
        $: PORT, // Service port
        '@enabled': true,
      },

      // VIP address used by other services to find this service
      vipAddress: 'node-service',

      // Data center info
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host: 'localhost', // Eureka server hostname
      port: 8761, // Eureka server port
      servicePath: '/eureka/apps/',
      maxRetries: 5,
      requestRetryDelay: 2000,
      useDns: false,
    },
  });

  // Start the Eureka client
  client.start((error) => {
    if (error) {
      console.error('Eureka registration failed:', error);
    } else {
      console.log('Eureka registration successful');
    }
  });
}
bootstrap();
