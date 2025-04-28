const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'purge')) return;
        
        await interaction.deferReply({ ephemeral: true });

        const amount = interaction.options.getInteger('amount');

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            const filteredMessages = messages.filter(msg => !msg.pinned);

            await interaction.channel.bulkDelete(filteredMessages);

            const embed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.success)
                .setTitle('🧹 Messages Purged')
                .setDescription(`${filteredMessages.size} messages were deleted`)
                .addFields(
                    { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Channel', value: `${interaction.channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: interaction.client.config.branding.footer });

            await interaction.channel.send({ embeds: [embed] });

            await Logger.logModeration(interaction.client, {
                action: 'purge',
                moderator: interaction.user,
                channel: interaction.channel,
                description: `${filteredMessages.size} messages were purged by ${interaction.user.tag}`,
                color: interaction.client.config.colors.success
            });

            await interaction.editReply({
                content: `Successfully deleted ${filteredMessages.size} messages`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in purge command:', error);
            await interaction.editReply({
                content: 'There was an error deleting messages.',
                ephemeral: true
            });
        }
    }
}; 