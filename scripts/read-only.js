const { WebClient } = require("@slack/client");
const { pathOr, remove } = require("ramda");

module.exports = robot => {
  const web = new WebClient(process.env.HUBOT_SLACK_ADMIN_TOKEN);

  const getChannelID = channelName =>
    web.channels.list().then(api_response => {
      const room = api_response.channels.find(
        channel => channel.name === channelName
      );
      return room ? room.id : "";
    });

  const getReadOnlyChannels = () => {
    if (!robot.brain.get("read_only_channels")) {
      robot.brain.set("read_only_channels", []);
    }
    return robot.brain.get("read_only_channels");
  };
  robot.listenerMiddleware(function(context, next, done) {
    const readOnly = getReadOnlyChannels();
    if (!readOnly.filter(data => data.id === context.response.message.room)) {
      return next();
    }

    const is_bot = pathor(
      false,
      ["response", "message", "user", "slack", "is_bot"],
      context
    );

    const is_app = pathor(
      false,
      ["response", "message", "user", "slack", "is_app"],
      context
    );

    if (is_bot || is_app) {
      console.log({ is_bot });
      console.log({ is_app });
      return next();
    }

    web.chat.postEphemeral(
      context.response.message.room,
      "This is a read only channel, don't say things in here!",
      context.response.message.user.id,
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
    web.chat.delete(
      context.response.message.rawMessage.ts,
      context.response.message.room
    );
    return done();
  });

  robot.respond(
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

          if (readOnly.filter(data => data.id === id)) {
            return msg.reply(`#${channel} is already read only.`);
          }

          readOnly.push({ id, channel });
          robot.brain.set("read_only_channels", readOnly);
          return msg.reply(`#${channel} is now read only.`);
        })
        .catch(robot.logger.debug);
    }
  );

  robot.respond(/#?([^\s]+) (?:is not|isn`?t) read only$/i, msg => {
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

        if (!readOnly.filter(data => data.id === id)) {
          return msg.reply(`#${channel} is not read only.`);
        }

        remove({ id, channel }, readonly);

        robot.brain.set("read_only_channels", readOnly);
        return msg.reply(`#${channel} is no longer read only.`);
      })
      .catch(robot.logger.debug);
  });

  robot.respond(/which channels are read only$/i, msg => {
    const readOnly = getReadOnlyChannels();
    const channels = readOnly.map(data => data.channel);
    const channel_list = channels.join();
    return msg.reply(`These channels are read only: ${channel_list}.`);
  });

  robot.respond(/no channels are read only$/i, msg => {
    robot.brain.set("read_only_channels", []);
    return msg.reply(`There are now no read only channels!`);
  });
};
