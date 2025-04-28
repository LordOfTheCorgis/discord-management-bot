const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('../config.json');

class StatusManager {
    constructor(client) {
        this.client = client;
        this.statusIndex = 0;
    }

    init() {
        this.updateStatus();

        setInterval(() => {
            this.updateStatus();
        }, 10 * 1000);
    }

    getNextStatus() {
        // Get the main guild
        const mainGuild = this.client.guilds.cache.get(config.guilds.main);
        const totalMembers = mainGuild ? mainGuild.memberCount : 0;
        
        const statuses = [
            {
                type: ActivityType.Playing,
                text: `with ${totalMembers} Saints!`
            },
            {
                type: ActivityType.Watching,
                text: `${config.branding.name}!`
            },
            {
                type: ActivityType.Listening,
                text: `to /help commands.`
            },
            {
                type: ActivityType.Competing,
                text: `in ${config.branding.name}!`
            }
        ];

        this.statusIndex = (this.statusIndex + 1) % statuses.length;
        return statuses[this.statusIndex];
    }

    updateStatus() {
        const status = this.getNextStatus();
        this.client.user.setActivity(status.text, { type: status.type });
    }
}

module.exports = StatusManager; 