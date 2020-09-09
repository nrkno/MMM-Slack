var NodeHelper = require('node_helper');
const { RTMClient, LogLevel } = require('@slack/rtm-api');

var RTM_EVENTS = require('@slack/rtm-api').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/rtm-api').CLIENT_EVENTS;
const { WebClient } = require('@slack/web-api');
var userName = '';
var messageText = '';
var messages = [];

module.exports = NodeHelper.create({

	start: function() {
		console.log('Starting node helper for: ' + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'START_CONNECTION') {
			this.startSlackConnection(payload.config);
		}
    },

    getUserById:  async(token, userId, web) => {
        var userInfo = await web.users.info({
            token: token,
            user: userId
        });
        return userInfo.user.real_name;
    },
    
    sendChannelMessages: function(token, channel, web) {
        var self = this;
        if (!channel.ok)
            return console.log(channel.error);
        if (channel.warning)
            console.log(channel.warning);
        var slackMessages = [];

        (async() => {
            for(const message of channel.messages) {
                if(!message.subtype) {
                    var userName = await self.getUserById(token, message.user, web);
                    var slackMessage = {
                        'messageId': message.ts,
                        'user': userName,
                        'message': message.text
                    };
                    slackMessages.push(slackMessage);
                }
            }

            this.messages = slackMessages;
            this.broadcastMessage();
        })();
    },

	startSlackConnection: function(config) {
		var self = this;
		const token = config.slackToken;
        const rtm = new RTMClient(token);
        const web = new WebClient(token);

        (async ()  => {
            await rtm.start();
            var channel = await web.conversations.history({
                token: token,
                channel: config.slackChannelId
            });

            self.sendChannelMessages(token, channel, web);
          })();

		rtm.on("message", function handleRtmMessage(slackMessage) {
            (async () => {
                var channelInfo = await web.conversations.info({
                    token: token,
                    channel: slackMessage.channel
                });

                if(channelInfo.channel.id != config.slackChannelId)
                    return;
                
                if(slackMessage.subtype != null)
                {
                    switch(slackMessage.subtype)
                    {
                        case 'message_changed':
                            for(var i = 0; i < self.messages.length; i++) {
                                if(self.messages[i].messageId === slackMessage.message.ts) {
                                    var messageUserName = self.getUserById(token, slackMessage.message.user, web);
                                    self.messages[i].user = messageUserName;
                                    self.messages[i].message = slackMessage.message.text;
                                }
                            }
                            break;
                        case 'message_deleted':
                            for(var i =0; i < self.messages.length; i++) {
                                if(self.messages[i].messageId === slackMessage.deleted_ts) {
                                    self.messages.splice(i, 1);
                                }
                            }
                            break;
                    }
                }
                else
                {
                    var messageUserName = self.getUserById(token, slackMessage.user, web);
                    self.messages.unshift({'messageId': slackMessage.ts, 'user': messageUserName, 'message': slackMessage.text});
                }
                self.broadcastMessage();
            })();
		});
	},

	broadcastMessage: function() {
		this.sendSocketNotification('SLACK_DATA', this.messages);
	}
});