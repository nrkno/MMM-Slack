# MagicMirror² Module: MMM-Slack
This is a module integrating Slack in [MagicMirror²](https://github.com/MichMich/MagicMirror). It displays messages from the a given Slack channel in config.js. The module also supports update and delete messages

##Prerequisities
Go to your MagicMirror folder and run the command:

	npm install @slack/client

##How to install

Remote into your Magic Mirror box using a terminal software and go to the modules folder:

    cd ~/MagicMirror/modules

Clone the repository:

	git clone https://github.com/nrkno/MMM-Slack

Add the module to the modules array in the config/config.js file by adding the following section. You can change this configuration later when you see this works:

	{
		module: 'MMM-Slack',
		position: 'lower_third',
		config: {
			slackToken: 'YOUR_SLACK_TOKEN_GOES_HERE',
			slackChannel: 'THE_CHANNEL_YOU_WANT_MESSAGES_FROM'
		}
	},

## Configuration options

<table style="width:100%">
	<tr>
		<th>Option</th>
		<th>Comment</th>
		<th>Default</th>
	</tr>
	<tr>
		<td>slackToken</td>
		<td>You must create a test token for the [Slack API](https://api.slack.com/tokens) </td>
		<td>aaaa-bbbbb-ccccc-dddd-12344</td>
	</tr>
	<tr>
		<td>slackChannel</td>
		<td>Which Slack channel you want to display messages from</td>
		<td>test</td>
	</tr>
    <tr>
        <td>showUserName</td>
        <td>If true, the message sender's user name will be displayed with the message</td>
        <td>true</td>
    </tr>
    <tr>
        <td>showLatestMessageOnStartup</td>
        <td>If true, the latest message in the channel will be displayed on startup</td>
        <td>false</td>
    </tr>
</table>