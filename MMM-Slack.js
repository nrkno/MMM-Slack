Module.register('MMM-Slack',{
	defaults: {
        showLatestMessageOnStartup: false,
        showUserName: true
	},
	
	getStyles: function() {
		return ['slack.css'];
	},

	start: function() {
		this.slackMessage = {message: '', user: ''};
		this.openSlackConnection();
	},

	openSlackConnection: function() {
		this.sendSocketNotification('START_CONNECTION', {config: this.config});
	},

	socketNotificationReceived: function(notification, payload) {
		if(notification === 'SLACK_DATA'){
			if(payload.message != null) {
				this.slackMessage = payload;
				this.updateDom(2.5 * 1000);
			}
		}
	},

	getDom: function() {
		var messageElement = document.createElement('div');
		messageElement.className = 'light xlarge';
		
		if(this.slackMessage.message != '')
		{
			messageElement.innerHTML = this.slackMessage.message;
            if(this.config.showUserName) {
                var userElement = document.createElement('p');
                userElement.className = 'user';
                userElement.innerHTML = '@' + this.slackMessage.user;
			    messageElement.appendChild(userElement);
            }
		}
		return messageElement;
	}
});