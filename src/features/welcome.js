const { EmbedBuilder, Events } = require('discord.js');
const config = require('../config.json');

class WelcomeManager {
    constructor(client) {
        this.client = client;
    }

    init() {
        this.client.on(Events.GuildMemberAdd, async (member) => {
            try {
                const autoRoleId = '1346574974877569064';
                const autoRole = member.guild.roles.cache.get(autoRoleId);
                
                if (autoRole) {
                    await member.roles.add(autoRole).catch(error => {
                        console.error('Error assigning auto-role:', error);
                    });
                } else {
                    console.error('Auto-role not found. Please check the role ID.');
                }

                const welcomeChannel = member.guild.channels.cache.get(config.channels.welcome);
                if (!welcomeChannel) {
                    console.error('Welcome channel not found. Please check the channel ID in config.json');
                    return;
                }

                const welcomeEmbed = new EmbedBuilder()
                    .setColor(config.colors.default)
                    .setTitle(`Welcome to ${config.branding.name}`)
                    .setDescription(`Welcome to the family, ${member}! 🎉\nWe're excited to have you join our community.`)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .addFields(
                        { 
                            name: '📌 Getting Started',
                            value: `• Read our <#${config.channels.welcome}>\n• Submit your application in <#1346700026092453939>`,
                            inline: true
                        },
                        {
                            name: '🎮 Quick Links',
                            value: `• [Connect to Server](${config.branding.links.connect})\n• [CAD System](${config.branding.links.cad})`,
                            inline: true
                        },
                        {
                            name: '💡 Need Help?',
                            value: `• Open a ticket in <#1346700026092453939> for support`,
                            inline: true
                        }
                    )
                    .setFooter({ 
                        text: config.branding.footer
                    })
                    .setTimestamp();

                await welcomeChannel.send({ 
                    content: `${member}`,
                    embeds: [welcomeEmbed]
                }).catch(error => {
                    console.error('Error sending welcome message:', error);
                });
            } catch (error) {
                console.error('Error in welcome message:', error);
            }
        });
    }
}

module.exports = WelcomeManager; 