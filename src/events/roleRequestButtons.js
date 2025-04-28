const { EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const config = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (!interaction.customId.startsWith('approve_role_') && !interaction.customId.startsWith('deny_role_')) return;

        try {
            if (!interaction.member.roles.cache.has(config.roles.requestHandler)) {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: 'You do not have permission to handle role requests.',
                        ephemeral: true
                    });
                }
                return;
            }

            const parts = interaction.customId.split('_');
            const action = parts[0];
            const userId = parts[2];
            const roleId = parts[3];
            const isApprove = action === 'approve';

            if (!interaction.deferred) {
                await interaction.deferUpdate();
            }

            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            const role = await interaction.guild.roles.fetch(roleId).catch(() => null);

            if (!member || !role) {
                await interaction.followUp({
                    content: 'Error: Could not find the user or role. The user may have left the server.',
                    ephemeral: true
                });
                return;
            }

            if (isApprove) {
                try {
                    await member.roles.add(role);
                } catch (error) {
                    await interaction.followUp({
                        content: `Error: Could not add the role to the user. Please check my permissions and role hierarchy.`,
                        ephemeral: true
                    });
                    return;
                }
            }

            const responseEmbed = new EmbedBuilder()
                .setColor(isApprove ? config.colors.success : config.colors.error)
                .setTitle(isApprove ? 'Role Request Approved' : 'Role Request Denied')
                .addFields(
                    {
                        name: 'User',
                        value: `${member.user}`,
                        inline: true
                    },
                    {
                        name: 'Role',
                        value: `${role}`,
                        inline: true
                    },
                    {
                        name: 'Action By',
                        value: `${interaction.user}`,
                        inline: true
                    }
                )
                .setFooter({ text: config.branding.footer })
                .setTimestamp();

            await interaction.message.edit({
                embeds: [responseEmbed],
                components: []
            });

            const logger = new Logger(interaction.client);
            await logger.logRoleAction({
                action: isApprove ? 'Role Request Approved' : 'Role Request Denied',
                user: member.user,
                role: role,
                moderator: interaction.user,
                description: isApprove 
                    ? `${member.user.tag}'s request for ${role.name} was approved`
                    : `${member.user.tag}'s request for ${role.name} was denied`,
                color: isApprove ? config.colors.success : config.colors.error,
                reason: interaction.message.embeds[0]?.fields?.find(f => f.name === 'Reason')?.value || 'No reason provided'
            }).catch(() => {});

            try {
                await member.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(isApprove ? config.colors.success : config.colors.error)
                            .setTitle(isApprove ? 'Role Request Approved' : 'Role Request Denied')
                            .setDescription(isApprove 
                                ? `Your request for the role \`${role.name}\` has been approved by ${interaction.user.tag}.`
                                : `Your request for the role \`${role.name}\` has been denied by ${interaction.user.tag}.`)
                            .setFooter({ text: config.branding.footer })
                            .setTimestamp()
                    ]
                });
            } catch (dmError) {}

            await interaction.followUp({
                content: `Successfully ${isApprove ? 'approved' : 'denied'} the role request for ${member.user.tag}`,
                ephemeral: true
            });

        } catch (error) {
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'There was an error processing this role request.',
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: 'There was an error processing this role request.',
                        ephemeral: true
                    });
                }
            } catch (followUpError) {}
        }
    },
}; 