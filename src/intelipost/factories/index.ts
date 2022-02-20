import { Env } from 'src/commons/environment/env';
import { v4 as uuidV4 } from 'uuid';

// KAFKA_TOPIC_INTELIPOST_CREATED
export const MessageIntelipostCreated = content => {
  const { createIntelipost } = content;
  return {
    headers: {
      'X-Channel-Id': Env.SALES_CHANNEL_ID,
      'X-Version': '1.0',
    },
    key: uuidV4(),
    value: JSON.stringify({
      data: {
        createIntelipost,
      },
    }),
  };
};
