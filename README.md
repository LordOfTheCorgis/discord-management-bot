# Discord Management Bot

A powerful Discord bot designed for server management, moderation, and community engagement. This bot provides a comprehensive set of features for managing your Discord server, including moderation tools, role management, and automated welcome messages.

## Features

### General Commands
- `/help` - Display all available commands and features
- `/requestrole` - Request a role from staff members
- `/embed` - Create custom embed messages

### Admin Commands
- `/lock` - Lock the current channel (Requires: Manage Channels)
- `/unlock` - Unlock the current channel (Requires: Manage Channels)
- `/slowmode` - Set channel slowmode (Requires: Manage Channels)
- `/trust` - Trust a user to bypass slowmode (Owner-only)

### Moderation Commands
- `/global-kick` - Kick a member from all servers (Requires: Kick Members)
- `/global-ban` - Ban a member from all servers (Requires: Ban Members)
- `/global-unban` - Unban a member from all servers (Requires: Ban Members)
- `/timeout` - Timeout a member (Requires: Moderate Members)
- `/temp-role` - Give a member a temporary role (Requires: Manage Roles)
- `/purge` - Delete messages from channel (Requires: Manage Messages)
- `/remove` - Remove all roles from a user except member role (Requires: Manage Roles)

### Automated Features
- Welcome messages with custom embeds
- Role management
- Server status updates
- Word filtering
- Link protection

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/discord-management-bot.git
cd discord-management-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your bot token:
```
DISCORD_TOKEN=your_bot_token_here
```

4. Configure the `config.json` file (see Configuration section below)

5. Start the bot:
```bash
npm start
```

## Configuration

The `config.json` file contains all the necessary configuration for the bot. Here's a breakdown of each section:

### Channels
```json
"channels": {
    "logs": {
        "moderation": "channel_id",
        "roles": "channel_id"
    },
    "requests": {
        "roles": "channel_id"
    },
    "welcome": "channel_id",
    "staffWaiting": "channel_id",
    "application": "channel_id"
}
```
- `logs`: Channels for logging moderation actions and role changes
- `requests`: Channel for role requests
- `welcome`: Channel for welcome messages
- `staffWaiting`: Channel for staff waiting area
- `application`: Channel for applications

### Colors
```json
"colors": {
    "default": "#2B2D31",
    "success": "#57F287",
    "error": "#ED4245",
    "warning": "#FEE75C"
}
```
Custom colors for different types of embeds.

### Branding
```json
"branding": {
    "name": "Your Server Name",
    "footer": "Your Server Footer",
    "links": {
        "connect": "your_connect_link",
        "cad": "your_cad_link"
    }
}
```
Customize your server's branding and links.

### Roles
```json
"roles": {
    "requestHandler": "role_id",
    "member": "role_id",
    "autoRole": "role_id",
    "moderation": {
        "globalBan": "role_id",
        "globalKick": "role_id",
        "timeout": "role_id",
        "lock": "role_id",
        "purge": "role_id",
        "tempRole": "role_id",
        "remove": "role_id"
    }
}
```
Configure all role IDs for different permissions.

### Tickets
```json
"tickets": {
    "supportRole": "role_id",
    "categories": {
        "support": "category_id",
        "report": "category_id",
        "development": "category_id",
        "management": "category_id",
        "closed": "category_id"
    }
}
```
Configure ticket system categories and support role.

### Filters
```json
"filters": {
    "restrictedWords": ["word1", "word2"],
    "discordLinkRoles": ["role_id"],
    "linkPostWhitelistedChannels": ["channel_id"]
}
```
Configure word filters and link protection.

## Permissions

The bot requires the following permissions:
- `Manage Channels` - For channel management commands
- `Manage Roles` - For role management
- `Manage Messages` - For message deletion and purging
- `Kick Members` - For kick commands
- `Ban Members` - For ban commands
- `Moderate Members` - For timeout commands
- `Send Messages` - For sending messages
- `Embed Links` - For sending embeds
- `Attach Files` - For sending files
- `Read Message History` - For reading messages
- `Add Reactions` - For reaction-based features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 