// Description:
//   Slack signup page
//
// Configuration:
//   SLACK_SIGNUP_COMMUNITY_NAME - Your community or team name to display on join page.
//   SLACK_SIGNUP_COMMUNITY_URL - Your Slack team url (eg. socketio.slack.com)
//   SLACK_SIGNUP_COMMUNITY_ADMIN_TOKEN - Your access token for Slack. (see Issue token)
//   SLACK_SIGNUP_INVITE_TOKEN - An optional security measure - if it is set, then that token will be required to get invited.
//   SLACK_SIGNUP_RECAPTCHA_SITE - An optional security measure - used to enable reCAPTCHA.
//   SLACK_SIGNUP_RECAPTCHA_SECRET - An optional security measure - used to enable reCAPTCHA.
//   SLACK_SIGNUP_LOCALE - Application language (currently cs, de, en, es, fr, it, ja, ko, nl, pl, pt, pt-BR, tr, zh-CN and zh-TW available).
//   SLACK_SIGNUP_SUBPATH - Sub-path in URL. For example, if /example is set, it's served in /example, not /. Default is /.
//
// Commands:
//
// Author:
//
// Notes:
//

const sia = require("slack-invite-automation/app");

module.exports = robot => {
  robot.router.use(sia);
};
