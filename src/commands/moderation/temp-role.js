const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Permissions = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temp-role')
        .setDescription('Assign a role to a member for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('How long to give the role for (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for giving the temporary role')
                .setRequired(false)),

    async execute(interaction) {
        if (!Permissions.checkModerationPermission(interaction, 'tempRole')) return;
        
        try {
            await interaction.deferReply({ ephemeral: true });

            const targetUser = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const durationStr = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

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

            const botMember = await interaction.guild.members.fetchMe();
            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return await interaction.editReply({
                    content: 'I do not have permission to manage roles.',
                    ephemeral: true
                });
            }

            if (role.position >= botMember.roles.highest.position) {
                return await interaction.editReply({
                    content: 'I cannot manage this role as it is higher than or equal to my highest role.',
                    ephemeral: true
                });
            }

            if (role.position >= interaction.member.roles.highest.position) {
                return await interaction.editReply({
                    content: 'You cannot manage this role as it is higher than or equal to your highest role.',
                    ephemeral: true
                });
            }
            
            await member.roles.add(role);

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(interaction.client.config.colors.success)
                    .setTitle('🎭 Role Notice - Temporary Role Added')
                    .setDescription(`You have been given a temporary role in ${interaction.guild.name}.`)
                    .addFields(
                        { name: 'Role', value: role.name },
                        { name: 'Duration', value: durationStr },
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp()
                    .setFooter({ text: interaction.client.config.branding.footer });

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Could not DM user:', error);
            }

            setTimeout(async () => {
                try {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        
                        await Logger.logModeration(interaction.client, {
                            action: 'Temporary Role Removed',
                            moderator: interaction.user,
                            target: targetUser,
                            role: role,
                            reason: 'Role duration expired',
                            guild: interaction.guild
                        });

                        try {
                            const expiredEmbed = new EmbedBuilder()
                                .setColor(interaction.client.config.colors.warning)
                                .setTitle('🎭 Role Notice - Role Expired')
                                .setDescription(`Your temporary role in ${interaction.guild.name} has expired.`)
                                .addFields(
                                    { name: 'Role', value: role.name }
                                )
                                .setTimestamp()
                                .setFooter({ text: interaction.client.config.branding.footer });

                            await targetUser.send({ embeds: [expiredEmbed] });
                        } catch (error) {
                            console.error('Could not send expiration DM:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error removing temporary role:', error);
                }
            }, duration);

            await Logger.logModeration(interaction.client, {
                action: 'Temporary Role Added',
                moderator: interaction.user,
                target: targetUser,
                role: role,
                reason: reason,
                duration: durationStr,
                guild: interaction.guild
            });
            
            await interaction.editReply({
                content: `Successfully gave ${targetUser.tag} the role ${role.name} for ${durationStr}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in temp-role command:', error);
            await interaction.editReply({
                content: 'There was an error executing the temp-role command.',
                ephemeral: true
            });
        }
    }
}; 