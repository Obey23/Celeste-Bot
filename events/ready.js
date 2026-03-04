const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('Ready! Logged in as ' + client.user.tag);
        process.stdout.write(String.fromCharCode(27) + "]0;" + client.user.tag + String.fromCharCode(7));

        await client.application.fetch();
        await client.application.emojis.fetch();
        await client.application.commands.fetch();
        
        const guilds = await client.guilds.fetch({ limit: 200 });
        for (const guild of client.guilds.cache) {
            await guild[1].members.fetch({ force: true });
        }
    }
};