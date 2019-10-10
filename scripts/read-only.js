const { WebClient } = require("@slack/client");

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
    if (getReadOnlyChannels().indexOf(context.response.message.room) === -1) {
      return next();
    }

    if (
      context.response.message.user.slack.is_bot ||
      context.response.message.user.slack.is_app
    ) {
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

          if (readOnly.includes(id)) {
            return msg.reply(`#${channel} is already read only.`);
          }

          readOnly.push(id);
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

        if (!readOnly.includes(id)) {
          return msg.reply(`#${channel} is not read only.`);
        }

        const index = readOnly.indexOf(id);
        if (index > -1) {
          readOnly.splice(index, 1);
        }

        robot.brain.set("read_only_channels", readOnly);
        return msg.reply(`#${channel} is no longer read only.`);
      })
      .catch(robot.logger.debug);
  });
};
