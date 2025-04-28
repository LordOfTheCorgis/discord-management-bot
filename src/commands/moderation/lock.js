const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel to prevent messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock')
                .setRequired(false)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'lock')) return;
        
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (!channel.isTextBased()) {
            return await interaction.editReply({
                content: 'This command can only be used on text channels.',
                ephemeral: true
            });
        }

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.warning)
                .setTitle('🔒 Channel Locked')
                .setDescription(`This channel has been locked by ${interaction.user}`)
                .setTimestamp()
                .setFooter({ text: interaction.client.config.branding.footer });

            await channel.send({ embeds: [embed] });

            await Logger.logModeration(interaction.client, {
                action: 'lock',
                moderator: interaction.user,
                channel: channel,
                description: `${channel.name} was locked by ${interaction.user.tag}`,
                color: interaction.client.config.colors.warning
            });

            await interaction.editReply({
                content: `Successfully locked ${channel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in lock command:', error);
            await interaction.editReply({
                content: 'There was an error locking the channel.',
                ephemeral: true
            });
        }
    }
}; 