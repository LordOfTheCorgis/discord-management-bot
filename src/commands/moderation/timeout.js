const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('How long to timeout the user (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout')
                .setRequired(true)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'timeout')) return;
        
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason');

        const durationMatch = durationStr.match(/^(\d+)([mhd])$/);
        if (!durationMatch) {
            return await interaction.editReply({
                content: 'Invalid duration format. Use format like: 1h, 30m, 1d',
                ephemeral: true
            });
        }

        const [, amount, unit] = durationMatch;
        const duration = {
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        }[unit] * parseInt(amount);

        const member = await interaction.guild.members.fetch(targetUser.id);
        if (!member) {
            return await interaction.editReply({
                content: 'Could not find the specified user.',
                ephemeral: true
            });
        }

        try {
            await member.timeout(duration, reason);

            const dmEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.warning)
                .setTitle('⏰ Timeout')
                .setDescription(`You have been timed out in ${interaction.guild.name}`)
                .addFields(
                    { name: 'Duration', value: durationStr },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: interaction.client.config.branding.footer });

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Could not DM user:', error);
            }

            const channelEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.warning)
                .setTitle('⏰ Timeout Executed')
                .setDescription(`${targetUser.tag} has been timed out`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Duration', value: durationStr, inline: true },
                    { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setFooter({ 
                    text: `${config.branding.name} Moderation System`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.channel.send({ embeds: [channelEmbed] });

            await Logger.logModeration(interaction.client, {
                action: 'timeout',
                moderator: interaction.user,
                target: targetUser,
                reason: reason,
                guild: interaction.guild,
                duration: durationStr
            });

            await interaction.editReply({
                content: `Successfully timed out ${targetUser.tag} for ${durationStr}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in timeout command:', error);
            await interaction.editReply({
                content: 'There was an error executing the timeout command.',
                ephemeral: true
            });
        }
    }
}; 