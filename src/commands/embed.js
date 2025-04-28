const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed message')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('embedModal')
                .setTitle('Create Embed');

            // Title input
            const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(256);

            // Description input
            const descriptionInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(4000);

            // Color input
            const colorInput = new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Color (hex or name)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setValue('#2B2D31');

            // Footer input
            const footerInput = new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Footer Text')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setMaxLength(2048);

            // Fields input
            const fieldsInput = new TextInputBuilder()
                .setCustomId('fields')
                .setLabel('Fields (name|value|inline)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Example: Rules|1. Be nice|true;Info|This is a roleplay server|false');

            // Add all inputs to the modal
            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(colorInput),
                new ActionRowBuilder().addComponents(footerInput),
                new ActionRowBuilder().addComponents(fieldsInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error showing modal:', error);
            await interaction.reply({
                content: 'There was an error creating the embed. Please try again.',
                flags: 64 // Ephemeral flag
            });
        }
    },

    async handleModalSubmit(interaction) {
        try {
            await interaction.deferReply({ flags: 64 }); // Ephemeral flag

            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color') || '#2B2D31';
            const footer = interaction.fields.getTextInputValue('footer');
            const fieldsString = interaction.fields.getTextInputValue('fields');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();

            if (footer) embed.setFooter({ text: footer });

            if (fieldsString && fieldsString.trim()) {
                const fields = fieldsString.split(';').map(field => {
                    const parts = field.split('|');
                    if (parts.length < 2) return null;
                    
                    return {
                        name: parts[0].trim(),
                        value: parts[1].trim(),
                        inline: parts[2]?.trim().toLowerCase() === 'true'
                    };
                }).filter(field => field !== null);

                if (fields.length > 0) {
                    embed.addFields(fields);
                }
            }

            await interaction.editReply({
                content: 'Here\'s your embed preview:',
                embeds: [embed]
            });

            // Send the embed to the channel
            await interaction.channel.send({ embeds: [embed] });

            await interaction.followUp({
                content: 'Embed has been sent to the channel!',
                flags: 64 // Ephemeral flag
            });
        } catch (error) {
            console.error('Error creating embed:', error);
            await interaction.editReply({
                content: 'There was an error creating the embed. Please check your inputs and try again.',
                flags: 64 // Ephemeral flag
            });
        }
    }
}; 