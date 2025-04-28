const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display comprehensive information about available commands'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const logoPath = path.join(__dirname, '..', 'assets', 'images', 'logo.png');

            const helpEmbed = new EmbedBuilder()
                .setColor('#0078D7')
                .setTitle(`${config.branding.name} Bot Commands`)
                .setDescription('Here are all the available commands and features:')
                .addFields(
                    {
                        name: '🛠️ General Commands',
                        value: '`/help` - Shows this help message\n`/requestrole` - Request a role from staff\n`/embed` - Create a custom embed message',
                        inline: false
                    },
                    {
                        name: '👮 Admin Commands',
                        value: '`/lock` - Lock current channel\n`/unlock` - Unlock current channel\n`/slowmode` - Set channel slowmode\n`/trust` - Trust a user to bypass slowmode (Owner-only)',
                        inline: false
                    },
                    {
                        name: '🔨 Moderation Commands',
                        value: '`/global-kick` - Kick a member from all servers\n`/global-ban` - Ban a member from all servers\n`/global-unban` - Unban a member from all servers\n`/timeout` - Timeout a member\n`/temp-role` - Give a member a temporary role\n`/purge` - Delete messages from channel\n`/remove` - Remove all roles from a user except member role',
                        inline: false
                    },
                    {
                        name: '📌 Quick Links',
                        value: `• [Connect to Server](${config.branding.links.connect})\n• [CAD System](${config.branding.links.cad})`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${config.branding.name} | Server Core`,
                    iconURL: 'attachment://logo.png'
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [helpEmbed],
                files: [{
                    attachment: logoPath,
                    name: 'logo.png'
                }]
            });
        } catch (error) {
            console.error('Error in help command:', error);
            
            const errorMessage = { 
                content: 'There was an error showing the help message. Please try again later.',
                ephemeral: true
            };

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(errorMessage);
            } else {
                await interaction.editReply(errorMessage);
            }
        }
    },
}; 