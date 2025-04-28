const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Restore message sending permissions in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.editReply({
                    content: 'You do not have permission to unlock channels.',
                    ephemeral: true
                });
            }

            const botMember = await interaction.guild.members.fetchMe();
            if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.editReply({
                    content: 'I do not have permission to unlock channels.',
                    ephemeral: true
                });
            }

            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null,
                AddReactions: null,
                CreatePublicThreads: null,
                CreatePrivateThreads: null
            });

            const logger = new Logger(interaction.client);
            await logger.logModAction({
                action: 'Channel Unlocked',
                moderator: interaction.user,
                channel: interaction.channel,
                description: `${interaction.channel.name} was unlocked by ${interaction.user.tag}`,
                color: config.colors.success
            }).catch(() => {});

            await interaction.editReply({
                content: `🔓 Channel has been unlocked by ${interaction.user.tag}`,
                ephemeral: true
            });

        } catch (error) {
            await interaction.editReply({
                content: 'There was an error while unlocking the channel.',
                ephemeral: true
            });
        }
    },
}; 