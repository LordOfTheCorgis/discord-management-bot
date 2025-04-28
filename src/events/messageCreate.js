const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const content = message.content.toLowerCase();
        const restrictedWords = config.filters.restrictedWords || [];
        
        for (const word of restrictedWords) {
            if (content.includes(word.toLowerCase())) {
                await message.delete().catch(console.error);

                const canBeTimedOut = message.member.moderatable;

                if (canBeTimedOut) {
                    await message.member.timeout(60000, 'Inappropriate language').catch(console.error);

                    const channelEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('⚠️ Message Filtered')
                        .setDescription(`${message.author} has been timed out for 1 minute due to inappropriate language.`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    await message.channel.send({ embeds: [channelEmbed] });

                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('⚠️ Message Filtered')
                        .setDescription(`Your message was filtered for inappropriate language:\n\`${message.content}\`\n\nYou have been timed out for 1 minute.`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    try {
                        await message.author.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        console.error('Could not DM user:', error);
                    }
                }

                const logChannel = message.guild.channels.cache.get(config.channels.logs.moderation);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('🚫 Filtered Message')
                        .setDescription(`**User:** ${message.author} (${message.author.id})
**Channel:** ${message.channel} (${message.channel.id})
**Content:** \`${message.content}\`
**Action:** ${canBeTimedOut ? '1 Minute Timeout' : 'Message Deleted'}`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

                return;
            }
        }

        const discordLinkRegex = /(https?:\/\/)?(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]+/g;
        const hasDiscordLink = discordLinkRegex.test(message.content);
        
        if (hasDiscordLink) {

            const isWhitelistedChannel = config.filters.linkPostWhitelistedChannels.includes(message.channel.id);
            if (isWhitelistedChannel) return;

            const hasAllowedRole = message.member.roles.cache.some(role => 
                config.filters.discordLinkRoles.includes(role.id)
            );

            if (!hasAllowedRole) {
                await message.delete().catch(console.error);

                const canBeTimedOut = message.member.moderatable;

                if (canBeTimedOut) {
                    await message.member.timeout(60000, 'Unauthorized Discord link').catch(console.error);

                    const channelEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('⚠️ Message Filtered')
                        .setDescription(`${message.author} has been timed out for 1 minute for posting an unauthorized Discord link.`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    await message.channel.send({ embeds: [channelEmbed] });

                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('⚠️ Message Filtered')
                        .setDescription(`Your message was filtered for containing an unauthorized Discord link:\n\`${message.content}\`\n\nYou have been timed out for 1 minute.`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    try {
                        await message.author.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        console.error('Could not DM user:', error);
                    }
                }

                const logChannel = message.guild.channels.cache.get(config.channels.logs.moderation);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('🚫 Filtered Message')
                        .setDescription(`**User:** ${message.author} (${message.author.id})
**Channel:** ${message.channel} (${message.channel.id})
**Content:** \`${message.content}\`
**Action:** ${canBeTimedOut ? '1 Minute Timeout' : 'Message Deleted'}`)
                        .setFooter({ text: config.branding.footer })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }

                return;
            }
        }
    },
}; 