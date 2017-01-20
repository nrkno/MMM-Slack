var NodeHelper = require('node_helper');
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var WebClient = require('@slack/client').WebClient;
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

	startSlackConnection: function(config) {
		var self = this;
		var token = process.env.SLACK_API_TOKEN || config.slackToken;

		var rtm = new RtmClient(token, { 
			logLevel: 'error',
			dataStore: new MemoryDataStore() 
		});
		
        rtm.start();

        rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
            var channel = rtm.dataStore.getGroupByName(config.slackChannel);
            var web = new WebClient(token);

            web.groups.history(channel.id, function(err, result) {
                if (err)
                    return console.log(err);
                if (!result.ok)
                    return console.log(result.error);
                if (result.warning)
                    console.log(result.warning);
                var slackMessages = [];
                result.messages.forEach(function(message) {
                    if(!message.subtype) {
                        var slackMessage = {
                            'messageId': message.ts,
                            'user': rtm.dataStore.getUserById(message.user).name, 
                            'message': message.text
                        };
                        slackMessages.push(slackMessage);
                    }
                });
                self.messages = slackMessages;
                self.broadcastMessage();
            });
        });

		rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(slackMessage) {
			var channelName = rtm.dataStore.getChannelGroupOrDMById(slackMessage.channel).name;
			if(channelName != config.slackChannel)
				return;
			if(slackMessage.subtype != null)
			{
				switch(slackMessage.subtype)
				{
					case 'message_changed':
                        for(var i =0; i < self.messages.length -1; i++) {
                            if(self.messages[i].messageId === slackMessage.message.ts) {
                                var userName = rtm.dataStore.getUserById(slackMessage.message.user).name;
                                self.messages[i].user = userName;
                                self.messages[i].message = slackMessage.message.text;
                            }
                        }
						break;
					case 'message_deleted':
						for(var i =0; i < self.messages.length -1; i++) {
                            if(self.messages[i].messageId === slackMessage.deleted_ts) {
                                self.messages.splice(i, 1);
                            }
                        }
						break;
				}
			}
			else
			{
				var userName = rtm.dataStore.getUserById(slackMessage.user).name;
                self.messages.unshift({'messageId': slackMessage.ts, 'user': userName, 'message': slackMessage.text});
			}
			self.broadcastMessage();
		});
	},

	broadcastMessage: function() {
		this.sendSocketNotification('SLACK_DATA', this.messages);
	}
});