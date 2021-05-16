const Boom = require("@hapi/boom");
const { replaceObjectKeys } = require("../../utils");

exports.saveLog = async function (request, h) {
  const Log = request.server.plugins.mongoose.connection.model("Log");
  try {
    await Log.insertMany(request.payload.logs.map(replaceObjectKeys));
    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
