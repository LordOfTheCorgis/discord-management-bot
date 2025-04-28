const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    EmbedBuilder
} = require('discord.js');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Configure message cooldown settings for the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const select = new StringSelectMenuBuilder()
                .setCustomId('slowmode_select')
                .setPlaceholder('Select slowmode duration')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Off')
                        .setDescription('Turn off slowmode')
                        .setValue('0')
                        .setEmoji('⭕'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('5 seconds')
                        .setDescription('Set 5 second delay')
                        .setValue('5')
                        .setEmoji('⏱️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('10 seconds')
                        .setDescription('Set 10 second delay')
                        .setValue('10')
                        .setEmoji('⏱️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('30 seconds')
                        .setDescription('Set 30 second delay')
                        .setValue('30')
                        .setEmoji('⏱️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('1 minute')
                        .setDescription('Set 1 minute delay')
                        .setValue('60')
                        .setEmoji('⏱️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('5 minutes')
                        .setDescription('Set 5 minute delay')
                        .setValue('300')
                        .setEmoji('⏱️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('10 minutes')
                        .setDescription('Set 10 minute delay')
                        .setValue('600')
                        .setEmoji('⏱️')
                );

            const row = new ActionRowBuilder()
                .addComponents(select);

            const response = await interaction.reply({
                content: 'Select slowmode duration for this channel:',
                components: [row],
                ephemeral: true
            });

            const collector = response.createMessageComponentCollector({ 
                time: 30000 // 30 seconds to select
            });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    const seconds = parseInt(i.values[0]);
                    await interaction.channel.setRateLimitPerUser(seconds);

                    const slowmodeEmbed = new EmbedBuilder()
                        .setColor(seconds === 0 ? 0x00FF00 : 0xFF9900)
                        .setTitle(seconds === 0 ? '⭕ Slowmode Disabled' : `⏱️ Slowmode Enabled`)
                        .setDescription(seconds === 0 
                            ? 'Slowmode has been disabled for this channel.'
                            : `Slowmode set to ${formatDuration(seconds)} for this channel.`)
                        .setFooter({ 
                            text: `Modified by ${interaction.user.tag}`
                        })
                        .setTimestamp();

                    await interaction.channel.send({ embeds: [slowmodeEmbed] });

                    const logger = new Logger(interaction.client);
                    await logger.logModAction({
                        action: seconds === 0 ? 'Slowmode Disabled' : 'Slowmode Enabled',
                        moderator: interaction.user,
                        channel: interaction.channel,
                        description: seconds === 0 
                            ? 'Slowmode has been disabled'
                            : `Slowmode set to ${formatDuration(seconds)}`,
                        color: seconds === 0 ? '#00FF00' : '#FF9900'
                    });

                    await i.update({ 
                        content: `✅ Slowmode ${seconds === 0 ? 'disabled' : `set to ${formatDuration(seconds)}`}`,
                        components: [] 
                    });
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({
                        content: '❌ Slowmode selection timed out.',
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Error in slowmode command:', error);
            await interaction.reply({
                content: 'There was an error while setting slowmode.',
                ephemeral: true
            });
        }
    },
};

function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
} 