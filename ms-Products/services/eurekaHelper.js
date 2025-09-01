import client from "../eurekaClient.js";

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getServiceUrlWithRetry = async (appId, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const instances = client.getInstancesByAppId(appId);
    if (instances && instances.length > 0) {
      const instance = instances[0];
      const host = instance.hostName;
      const port = instance.port["$"];
      return `http://${host}:${port}`;
    }

    console.warn(
      `Attempt ${attempt}: ${appId} service not found in Eureka. Retrying in ${
        RETRY_DELAY_MS / 1000
      }s...`
    );
    if (attempt < retries) {
      await sleep(RETRY_DELAY_MS);
    } else {
      throw new Error(
        `${appId} service not found in Eureka after ${retries} attempts`
      );
    }
  }
};

export const getMsAlertUrl = async () => {
  return await getServiceUrlWithRetry("MS-ALERT");
};

export const getMsNotificationUrl = async () => {
  return await getServiceUrlWithRetry("MS-NOTIFICATION");
};

export const getMsAuthUrl = async () => {
  return await getServiceUrlWithRetry("USER-AUTH-SERVICE");
};
