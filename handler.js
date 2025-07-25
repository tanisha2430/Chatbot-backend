// handler.js

const { chatHandler } = require('./functions/chat');

const hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Serverless Offline!" }),
  };
};

module.exports = {
  hello,
  chatHandler
};
