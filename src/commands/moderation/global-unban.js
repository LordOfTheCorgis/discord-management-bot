const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');
const config = require('../../config.json');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('global-unban')
        .setDescription('Restore a member\'s access to all community servers')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unbanning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return await interaction.editReply({
                    content: 'You do not have permission to use global unban.',
                    ephemeral: true
                });
            }

            let unbannedServers = [];
            let failedServers = [];

            for (const guild of interaction.client.guilds.cache.values()) {
                try {
                    const botMember = await guild.members.fetchMe();
                    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
                        failedServers.push(`${guild.name} (Missing Bot Permissions)`);
                        continue;
                    }

                    const banList = await guild.bans.fetch();
                    if (!banList.has(targetUser.id)) {
                        failedServers.push(`${guild.name} (Not Banned)`);
                        continue;
                    }

                    await guild.members.unban(targetUser, `[Global Unban] ${reason}`);
                    unbannedServers.push(guild.name);

                    const logger = new Logger(interaction.client);
                    await logger.logModAction({
                        action: 'Global Unban',
                        moderator: interaction.user,
                        channel: interaction.channel,
                        description: `${targetUser.tag} was unbanned from ${guild.name} | Reason: ${reason}`,
                        color: config.colors.success
                    }).catch(() => {});

                } catch (error) {
                    failedServers.push(`${guild.name} (Error)`);
                }
            }

            let response = `Global Unban Results for ${targetUser.tag}:\n`;
            
            if (unbannedServers.length > 0) {
                response += `\nSuccessfully unbanned from:\n${unbannedServers.map(name => `• ${name}`).join('\n')}`;
            }
            
            if (failedServers.length > 0) {
                response += `\n\nFailed to unban from:\n${failedServers.map(name => `• ${name}`).join('\n')}`;
            }

            if (unbannedServers.length === 0) {
                response += '\nUser was not banned in any servers or could not be unbanned.';
            }
            
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('✅ Moderation Notice - Global Unban')
                    .setDescription(`Your access to ${config.branding.name} community servers has been restored.`)
                    .addFields(
                        {
                            name: 'Reason',
                            value: reason
                        },
                        {
                            name: 'Moderator',
                            value: interaction.user.tag
                        },
                        {
                            name: 'Next Steps',
                            value: 'You may now rejoin our community servers. Please ensure to review and follow our community guidelines to maintain good standing.'
                        }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp()
                    .setFooter({ text: config.footer });
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
            }

            await interaction.editReply({
                content: response,
                ephemeral: true
            });

        } catch (error) {
            await interaction.editReply({
                content: 'There was an error while executing the global unban.',
                ephemeral: true
            });
        }
    },
}; 