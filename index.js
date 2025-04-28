require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const StatusManager = require('./src/features/status');
const CommandHandler = require('./src/handlers/commandHandler');
const EventHandler = require('./src/handlers/eventHandler');
const WelcomeManager = require('./src/features/welcome');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

client.config = require('./src/config.json');
client.deletionCounts = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const statusManager = new StatusManager(client);
    statusManager.init();

    const commandHandler = new CommandHandler(client);
    commandHandler.init();

    const eventHandler = new EventHandler(client);
    eventHandler.init();

    const welcomeManager = new WelcomeManager(client);
    welcomeManager.init();
});

client.login(process.env.DISCORD_TOKEN); 