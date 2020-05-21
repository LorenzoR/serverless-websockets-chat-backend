import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import axios from 'axios';
import { ApiGatewayManagementApi } from 'aws-sdk';

const send = async (endpoint: string, connectionId: string, data: {}): Promise<boolean> => {
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });

  await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: data })
    .promise();

  return true;
};

const broadcast = async (data: string, endpoint: string): Promise<boolean> => {
  // Get all connections
  const connectionIds = [];

  try {
    const response = await axios.get('https://react-my-burger-57804.firebaseio.com/websockets.json');
    if (response && response.data) {
      // console.log('axios get', response.data);
      Object.keys(response.data).forEach((key) => {
        connectionIds.push(response.data[key].connectionId);
      });
    }
  } catch (error) {
    console.error(error);
  }

  const promises = [];

  for (let i = 0; i < connectionIds.length; i += 1) {
    // promises.push(apigwManagementApi.postToConnection({ ConnectionId: connectionIds[i], Data: data })
    //  .promise());
    promises.push(send(endpoint, connectionIds[i], data));
  }

  await Promise.all(promises);

  return true;
};

export const connectHandler: APIGatewayProxyHandler = async (event, _context) => {
  // console.log('event', event);
  console.log('/./././././././../././././././../././');
  // console.log('context', _context);
  console.log('Connected!');

  // Add connection to DB
  try {
    const payload = {
      connectionId: event.requestContext.connectionId,
    };
    await axios.post('https://react-my-burger-57804.firebaseio.com/websockets.json', payload);
    // console.log('axios response', response);
  } catch (error) {
    console.error(error);
  }

  // Send message saying that user connected
  try {
    const { connectionId } = event.requestContext;
    // const response = await send(event, connectionId, `user ${connectionId} connected`);
    await broadcast(`user ${connectionId} connected`, 'http://localhost:3001');
    // console.log('RESPONSE', response);
    // send(event, connectionId, 'mensaeeeee');
  } catch (error) {
    console.error('ERROR: ', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
};

export const disconnectHandler: APIGatewayProxyHandler = async (event, _context) => {
  // console.log('event', event);
  // console.log('context', _context);
  console.log('DISCONNECTED');

  // Delete connection ID
  const promises = [];

  try {
    const response = await axios.get('https://react-my-burger-57804.firebaseio.com/websockets.json');
    if (response && response.data) {
      // console.log('axios get', response.data);
      // for (let key in response.data) {
      Object.keys(response.data).forEach((key) => {
        if (response.data[key].connectionId === event.requestContext.connectionId) {
          try {
            console.log(`deleting https://react-my-burger-57804.firebaseio.com/websockets/${key}.json`);
            promises.push(axios.delete(`https://react-my-burger-57804.firebaseio.com/websockets/${key}.json`));
            console.log('deleted!');
            // Broadcaste message
            promises.push(broadcast(`user ${event.requestContext.connectionId} disconnected`, 'http://localhost:3001'));
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
  } catch (error) {
    console.error(error);
  }

  await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
      input: event,
    }, null, 2),
  };
};

export const messageHandler: APIGatewayProxyHandler = async (event, _context) => {
  console.log('event', event);
  console.log('/././/..././././...');
  console.log('context', _context);

  const postData = JSON.parse(event.body).data;
  console.log('postData', postData);

  try {
    const response = await broadcast(postData, 'http://localhost:3001');
    console.log('RESPONSE', response);
  } catch (error) {
    console.error('ERROR: ', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User connected',
    }, null, 2),
  };
};
