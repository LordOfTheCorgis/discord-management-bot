const config = require('../config.json');

class Permissions {
    static hasModerationRole(member, action) {
        if (!config.roles.moderation[action]) {
            console.error(`No role configured for moderation action: ${action}`);
            return false;
        }
        return member.roles.cache.has(config.roles.moderation[action]);
    }

    static checkModerationPermission(interaction, action) {
        if (!this.hasModerationRole(interaction.member, action)) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return false;
        }
        return true;
    }

    static async checkRequestHandlerPermission(interaction) {
        try {
            const member = interaction.member;
            if (!member) return false;

            const requiredRoleId = config.roles.requestHandler;
            
            // Direct role check
            if (member.roles.cache.has(requiredRoleId)) {
                return true;
            }

            // Check role inheritance
            const memberRoles = member.roles.cache.map(role => role.id);
            for (const roleId of memberRoles) {
                if (this.hasInheritedPermission(roleId, requiredRoleId)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking request handler permission:', error);
            return false;
        }
    }

    static async checkSupportPermission(interaction) {
        try {
            const member = interaction.member;
            if (!member) return false;

            const requiredRoleId = config.tickets.supportRole;
            
            // Direct role check
            if (member.roles.cache.has(requiredRoleId)) {
                return true;
            }

            // Check role inheritance
            const memberRoles = member.roles.cache.map(role => role.id);
            for (const roleId of memberRoles) {
                if (this.hasInheritedPermission(roleId, requiredRoleId)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking support permission:', error);
            return false;
        }
    }
}

module.exports = Permissions; 