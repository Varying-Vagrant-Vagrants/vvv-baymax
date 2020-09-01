// Description:
//   Read only channels

const { WebClient } = require("@slack/client");
const R = require("ramda");

module.exports = robot => {
  const web = new WebClient(process.env.HUBOT_SLACK_ADMIN_TOKEN);

  const getChannelID = channelName =>
    web.channels.list().then(api_response => {
      const room = api_response.channels.find(
        channel => channel.name === channelName
      );
      return room ? room.id : "";
    });
  const getChannel = channelName =>
    web.channels.list().then(api_response => {
      const room = api_response.channels.find(
        channel => channel.name === channelName
      );
      return room ? room : "";
    });
  const getReadOnlyChannels = () => {
    if (!robot.brain.get("read_only_channels")) {
      robot.brain.set("read_only_channels", []);
    }
    return robot.brain.get("read_only_channels");
  };
  const isReadOnly = roomId => {
    const readOnly = getReadOnlyChannels();
    return readOnly.some(data => data.id == roomId);
  };

  // robot.listenerMiddleware(function(context, next, done) {
  robot.catchAll(msg => {
    const message = msg.message;

    // only handle channel slack messages
    if (!message._channel_id) {
      console.log("Not a slack text message?");
      msg.finish();
      return;
    }

    if (!isReadOnly(message.room)) {
      msg.finish();
      return;
    }

    const is_bot = R.pathOr(false, ["user", "slack", "is_bot"], message);
    const is_app = R.pathOr(false, ["user", "slack", "is_app"], message);
    if (is_bot || is_app) {
      console.log({ is_bot, is_app });
      msg.finish();
      return;
    }

    web.chat.postEphemeral(
      message.rawMessage.channel,
      "This is a read only channel, you can't post messages in here!",
      message.user.id,
      {
        attachments: [
          {
            blocks: [
              {
                type: "image",
                title: {
                  type: "plain_text",
                  text: "Oh Hell No!",
                  emoji: true
                },
                image_url:
                  "https://media.giphy.com/media/3ov9jPX6j3r9IGO4zC/giphy.gif",
                alt_text: "Oh hell no"
              }
            ]
          }
        ]
      }
    );
    console.log(`Deleting message with ts: ${message.rawMessage.ts}`);
    web.chat.delete(message.rawMessage.ts, message.room);
    msg.finish();
    return;
  });

  /*robot.respond(
    /(?:make |set |mark )?#?([^\s]+) (?:is |as )?read only$/i,
    msg => {
      const channel = msg.match[1].trim();

      if (!robot.auth.isAdmin(msg.message.user)) {
        return msg.reply("Sorry, only admins can mark channels read only.");
      }

      const readOnly = getReadOnlyChannels();

      getChannelID(channel)
        .then(id => {
          if (!id) {
            return msg.reply(
              `Sorry, I cant seem to find a channel named #${channel}.`
            );
          }

          if (isReadOnly(id)) {
            return msg.reply(`#${channel} is already read only.`);
          }

          readOnly.push({ id, channel });
          robot.brain.set("read_only_channels", readOnly);
          return msg.reply(`#${channel} is now read only.`);
        })
        .catch(robot.logger.debug);
    }
  );*/

  /*  robot.respond(/#?([^\s]+) (?:is not|isn`?t) read only$/i, msg => {
    const channel = msg.match[1].trim();

    if (!robot.auth.isAdmin(msg.message.user)) {
      return msg.reply(
        "Sorry, only admins can mark channels as not read only."
      );
    }

    const readOnly = getReadOnlyChannels();

    getChannelID(channel)
      .then(id => {
        if (!id) {
          return msg.reply(
            `Sorry, I cant seem to find a channel named #${channel}.`
          );
        }

        if (!isReadOnly(id)) {
          return msg.reply(`#${channel} is not read only.`);
        }

        const newReadOnly = R.remove({ id, channel }, readonly);

        robot.brain.set("read_only_channels", newReadOnly);
        return msg.reply(`#${channel} is no longer read only.`);
      })
      .catch(robot.logger.debug);
  });*/

  robot.respond(/which channels are read only$/i, msg => {
    const readOnly = getReadOnlyChannels();
    const channels = readOnly.map(data => `#${data.channel} (${data.id})`);
    const channel_list = channels.join();
    return msg.reply(`These channels are read only: ${channel_list}.`);
  });

  /*  robot.respond(/no channels are read only$/i, msg => {
    if (!robot.auth.isAdmin(msg.message.user)) {
      return msg.reply(
        "Sorry, only admins can mark all channels as not read only."
      );
    }
    robot.brain.set("read_only_channels", []);
    return msg.reply(`There are now no read only channels!`);
  });*/
};
