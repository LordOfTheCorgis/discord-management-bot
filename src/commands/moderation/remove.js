const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Permissions = require('../../utils/permissions');
const Logger = require('../../utils/logger');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove all roles from a user except the member role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove roles from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for removing the roles')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'remove')) return;

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(targetUser.id);

        if (!member) {
            await interaction.reply({
                content: 'Could not find that member in the server.',
                ephemeral: true
            });
            return;
        }

        // Check if the bot can manage the member's roles
        if (!member.manageable) {
            await interaction.reply({
                content: 'I do not have permission to manage this user\'s roles.',
                ephemeral: true
            });
            return;
        }

        // Get the member role
        const memberRole = interaction.guild.roles.cache.get(interaction.client.config.roles.member);
        if (!memberRole) {
            await interaction.reply({
                content: 'Member role not found. Please check the configuration.',
                ephemeral: true
            });
            return;
        }

        // Store current roles for logging
        const previousRoles = [...member.roles.cache.values()]
            .filter(role => role.id !== interaction.guild.id) // Filter out @everyone
            .map(role => role.name);

        // Remove all roles except member role
        const rolesToRemove = member.roles.cache
            .filter(role => 
                role.id !== memberRole.id && // Keep member role
                role.id !== interaction.guild.id && // Keep @everyone
                role.position < interaction.guild.members.me.roles.highest.position // Check if bot can manage the role
            );

        try {
            await interaction.deferReply({ ephemeral: true });

            // Send DM to user before removing roles
            const userEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.warning)
                .setTitle('❌ Roles Removed')
                .setDescription(`Your roles have been removed in ${config.branding.name}`)
                .addFields(
                    { 
                        name: '📝 Reason',
                        value: reason
                    },
                    {
                        name: '🔰 Previous Roles',
                        value: previousRoles.length ? previousRoles.join(', ') : 'No roles'
                    }
                )
                .setFooter({ text: interaction.client.config.branding.footer })
                .setTimestamp();

            try {
                await member.send({ embeds: [userEmbed] });
            } catch (error) {
                console.error('Could not DM user:', error);
            }

            // Remove the roles
            await member.roles.remove(rolesToRemove);

            // Ensure member role is added
            if (!member.roles.cache.has(memberRole.id)) {
                await member.roles.add(memberRole);
            }

            // Log the action
            const logEmbed = new EmbedBuilder()
                .setColor(interaction.client.config.colors.warning)
                .setTitle('🔄 Roles Removed')
                .setDescription(`${interaction.user} has removed roles from ${member}`)
                .addFields(
                    { 
                        name: '👤 User',
                        value: `${member} (${member.id})`,
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value: `${interaction.user} (${interaction.user.id})`,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason
                    },
                    {
                        name: '🔰 Removed Roles',
                        value: previousRoles.length ? previousRoles.join(', ') : 'No roles'
                    }
                )
                .setFooter({ text: interaction.client.config.branding.footer })
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(interaction.client.config.channels.logs.moderation);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.editReply({
                content: `Successfully removed roles from ${member}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in remove command:', error);
            await interaction.editReply({
                content: 'There was an error while removing roles.',
                ephemeral: true
            });
        }
    }
}; 