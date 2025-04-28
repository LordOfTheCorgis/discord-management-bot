const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global-kick')
        .setDescription('Kick a user from all community servers')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(true)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'globalKick')) return;
        
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const dmEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.error)
            .setTitle('🔨 Global Kick')
            .setDescription(`You have been kicked from all ${config.branding.name} servers.\n\n**Reason:** ${reason}`)
            .setTimestamp()
            .setFooter({ text: interaction.client.config.branding.footer });

        try {
            await targetUser.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Could not DM user:', error);
        }

        const results = [];
        for (const guild of interaction.client.guilds.cache.values()) {
            try {
                const member = await guild.members.fetch(targetUser.id);
                if (member && member.kickable) {
                    await member.kick(reason);
                    await Logger.logModeration(interaction.client, {
                        action: 'kick',
                        moderator: interaction.user,
                        target: targetUser,
                        reason: reason,
                        guild: guild
                    });
                    results.push(`✅ ${guild.name}`);
                } else {
                    results.push(`❌ ${guild.name} (Cannot kick)`);
                }
            } catch (error) {
                results.push(`❌ ${guild.name} (${error.message})`);
            }
        }

        const channelEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.error)
            .setTitle('🔨 Global Kick Executed')
            .setDescription(`A global kick has been executed against ${targetUser.tag}`)
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

        channelEmbed.addFields({
            name: 'Kick Results',
            value: results.join('\n'),
            inline: false
        });

        await interaction.channel.send({ embeds: [channelEmbed] });

        const resultEmbed = new EmbedBuilder()
            .setColor(interaction.client.config.colors.success)
            .setTitle('🔨 Global Kick Results')
            .setDescription(`Results of kicking ${targetUser.tag} from all servers:`)
            .addFields(
                { name: '📋 Results', value: results.join('\n') }
            )
            .setTimestamp()
            .setFooter({ text: interaction.client.config.branding.footer });

        await interaction.editReply({ embeds: [resultEmbed], ephemeral: true });
    }
}; 