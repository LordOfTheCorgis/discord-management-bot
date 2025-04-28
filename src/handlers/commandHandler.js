const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        
        const loadCommandsFromDirectory = (directory) => {
            const files = fs.readdirSync(directory);
            
            for (const file of files) {
                const filePath = path.join(directory, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    loadCommandsFromDirectory(filePath);
                } else if (file.endsWith('.js')) {
                    const command = require(filePath);
                    
                    if ('data' in command && 'execute' in command) {
                        this.commands.set(command.data.name, command);
                    }
                }
            }
        };

        loadCommandsFromDirectory(commandsPath);
    }

    async registerCommands() {
        const commands = [];
        this.commands.forEach(command => commands.push(command.data.toJSON()));

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(this.client.user.id),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error registering commands:', error);
        }
    }

    async init() {
        await this.loadCommands();

        if (this.client.isReady()) {
            await this.registerCommands();
        } else {
            this.client.once('ready', async () => {
                await this.registerCommands();
            });
        }

        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isChatInputCommand()) return;

            const command = this.commands.get(interaction.commandName);
            if (!command) {
                console.log(`Command not found: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
                
                try {
                    const errorMessage = { 
                        content: 'There was an error executing this command!', 
                        ephemeral: true 
                    };

                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply(errorMessage);
                    } else {
                        await interaction.editReply(errorMessage);
                    }
                } catch (followUpError) {
                    console.error('Error sending error message:', followUpError);
                }
            }
        });
        
        this.client.on('error', error => {
            console.error('Client error:', error);
        });
    }
}

module.exports = CommandHandler; 