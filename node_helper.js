var NodeHelper = require('node_helper');
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var userName = '';
var messageText = '';

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

		rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(slackMessage) {
			var channelName = rtm.dataStore.getChannelGroupOrDMById(slackMessage.channel).name;
			if(channelName != config.slackChannel)
				return;
			if(slackMessage.subtype != null)
			{
				self.userName = rtm.dataStore.getUserById(slackMessage.message.user).name;
				switch(slackMessage.subtype)
				{
					case 'message_changed':
						self.messageText = slackMessage.message.text;
						break;
					case 'message_deleted':
						self.messageText = '';
						break;
				}
			}
			else
			{
				self.userName = rtm.dataStore.getUserById(slackMessage.user).name;
				self.messageText = slackMessage.text;
			}
			self.broadcastMessage();
		});
	},

	broadcastMessage: function() {
		var slackMessage = {
			'user': this.userName, 
			'message': this.messageText
		};
		this.sendSocketNotification('SLACK_DATA', slackMessage);
	}
});