const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request-role')
        .setDescription('Submit a formal request for a specific role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role you want to request')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why you want this role')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const role = interaction.options.getRole('role');
            const reason = interaction.options.getString('reason');

            const embed = {
                title: 'Role Request',
                description: `**User:** ${interaction.user}\n**Role:** ${role}\n**Reason:** ${reason}`,
                color: 0x0099ff,
                timestamp: new Date(),
                footer: {
                    text: `Requested by ${interaction.user.tag}`
                }
            };

            const channel = interaction.guild.channels.cache.get(config.channels.requests.roles);
            if (!channel) {
                return await interaction.editReply({
                    content: 'Error: Role requests channel not configured.',
                    ephemeral: true
                });
            }

            const row = {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        label: 'Approve',
                        custom_id: `approve_role_${interaction.user.id}_${role.id}`
                    },
                    {
                        type: 2,
                        style: 4,
                        label: 'Deny',
                        custom_id: `deny_role_${interaction.user.id}_${role.id}`
                    }
                ]
            };

            await channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({
                content: 'Your role request has been submitted for review.',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in request-role command:', error);
            await interaction.editReply({
                content: 'There was an error processing your role request.',
                ephemeral: true
            });
        }
    },
}; 