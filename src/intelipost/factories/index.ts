import { v4 as uuidV4 } from 'uuid';

// KAFKA_TOPIC_INTELIPOST_CREATED
export const MessageIntelipostCreated = content => {
  const { createIntelipost, headers } = content;
  return {
    headers: {
      'X-Correlation-Id':
        headers['X-Correlation-Id'] || headers['x-correlation-id'] || uuidV4(),
      'X-Version': '1.0',
    },
    key: uuidV4(),
    value: JSON.stringify({
      data: {
        ...createIntelipost,
      },
    }),
  };
};
