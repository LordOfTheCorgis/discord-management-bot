const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global-ban')
        .setDescription('Ban a user from all community servers')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'globalBan')) return;
        
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const dmEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.error)
            .setTitle('🔨 Global Ban')
            .setDescription(`You have been banned from all ${config.branding.name} servers.\n\n**Reason:** ${reason}`)
            .setTimestamp()
            .setFooter({ text: interaction.client.config.branding.footer });

        try {
            await targetUser.send({ embeds: [dmEmbed] });
        } catch (error) {
            if (error.code === 50007) {
                console.log(`Could not DM user ${targetUser.tag} (${targetUser.id}) - User has DMs disabled or has blocked the bot`);
            } else {
                console.error('Could not DM user:', error);
            }
        }

        const results = [];
        for (const guild of interaction.client.guilds.cache.values()) {
            try {
                // Try to ban directly first
                try {
                    await guild.members.ban(targetUser.id, { reason: reason });
                    const logger = new Logger(interaction.client);
                    await logger.logModAction({
                        action: 'Global Ban',
                        moderator: interaction.user,
                        channel: interaction.channel,
                        reason: reason,
                        description: `${targetUser.tag} (${targetUser.id}) was banned from ${guild.name}`
                    });
                    results.push(`✅ ${guild.name}`);
                    continue;
                } catch (banError) {
                    // If direct ban fails, try fetching member first
                    const member = await guild.members.fetch(targetUser.id).catch(() => null);
                    if (member && member.bannable) {
                        await member.ban({ reason: reason });
                        const logger = new Logger(interaction.client);
                        await logger.logModAction({
                            action: 'Global Ban',
                            moderator: interaction.user,
                            channel: interaction.channel,
                            reason: reason,
                            description: `${targetUser.tag} (${targetUser.id}) was banned from ${guild.name}`
                        });
                        results.push(`✅ ${guild.name}`);
                    } else {
                        results.push(`❌ ${guild.name} (Cannot ban)`);
                    }
                }
            } catch (error) {
                results.push(`❌ ${guild.name} (${error.message})`);
            }
        }

        // Create a detailed embed for the channel
        const channelEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.error)
            .setTitle('🔨 Global Ban Executed')
            .setDescription(`A global ban has been executed against ${targetUser.tag}`)
            .addFields(
                { name: 'User ID', value: targetUser.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ 
                text: `${config.branding.name} Moderation System`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add ban results
        channelEmbed.addFields({
            name: 'Ban Results',
            value: results.join('\n'),
            inline: false
        });

        // Send the embed to the channel
        await interaction.channel.send({ embeds: [channelEmbed] });

        const resultEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.success)
            .setTitle('🔨 Global Ban Results')
            .setDescription(`Results of banning ${targetUser.tag} from all servers:`)
            .addFields(
                { name: '📋 Results', value: results.join('\n') }
            )
            .setTimestamp()
            .setFooter({ text: interaction.client.config.branding.footer });

        await interaction.editReply({ embeds: [resultEmbed], ephemeral: true });
    }
}; 