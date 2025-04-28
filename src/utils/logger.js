const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

class Logger {
    constructor(client) {
        this.client = client;
    }

    async logRoleAction(options) {
        try {
            const logChannel = await this.client.channels.fetch(config.channels.logs.roles);
            if (!logChannel) return;

            const logEmbed = new EmbedBuilder()
                .setColor(options.color || config.colors.default)
                .setAuthor({ 
                    name: options.action,
                    iconURL: options.moderator.displayAvatarURL({ dynamic: true })
                })
                .setDescription(options.description)
                .addFields(
                    {
                        name: 'User',
                        value: `${options.user} (${options.user.id})`,
                        inline: true
                    },
                    {
                        name: 'Role',
                        value: `${options.role} (${options.role.id})`,
                        inline: true
                    },
                    {
                        name: 'Moderator',
                        value: `${options.moderator} (${options.moderator.id})`,
                        inline: true
                    }
                )
                .setFooter({ text: config.branding.footer })
                .setTimestamp();

            if (options.reason) {
                logEmbed.addFields({ name: 'Reason', value: options.reason, inline: false });
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error in role logging system:', error);
        }
    }

    async logModAction(options) {
        try {
            const logChannel = await this.client.channels.fetch(config.channels.logs.moderation);
            if (!logChannel) return;

            const logEmbed = new EmbedBuilder()
                .setColor(options.color || config.colors.default)
                .setAuthor({ 
                    name: options.action,
                    iconURL: options.moderator.displayAvatarURL({ dynamic: true })
                })
                .setDescription(options.description)
                .addFields(
                    {
                        name: 'Channel',
                        value: `${options.channel} (${options.channel.id})`,
                        inline: true
                    },
                    {
                        name: 'Moderator',
                        value: `${options.moderator} (${options.moderator.id})`,
                        inline: true
                    }
                )
                .setFooter({ text: config.branding.footer })
                .setTimestamp();

            if (options.reason) {
                logEmbed.addFields({ name: 'Reason', value: options.reason, inline: false });
            }

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error in moderation logging system:', error);
        }
    }
}

module.exports = Logger; 