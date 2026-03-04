const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

function prettyTime(ms, compress = false) {
    const seconds = ms / 1000;
    const parts = [];

    if (Math.floor(seconds / 31540000) > 0 || compress == false) parts.push(Math.floor(seconds / 31540000) + ((Math.floor(seconds / 31540000) == 1) ? ' year' : ' years'));
    if (Math.floor((seconds % 31540000) / 604800) > 0 || compress == false) parts.push(Math.floor((seconds % 31540000) / 604800) + ((Math.floor((seconds % 31540000) / 604800) == 1) ? ' week' : ' weeks'));
    if (Math.floor(((seconds % 31540000) % 604800) / 86400) > 0 || compress == false) parts.push(Math.floor(((seconds % 31540000) % 604800) / 86400) + ((Math.floor(((seconds % 31540000) % 604800) / 86400) == 1) ? ' day' : ' days'));
    if (Math.floor((((seconds % 31540000) % 604800) % 86400) / 3600) > 0 || compress == false) parts.push(Math.floor((((seconds % 31540000) % 604800) % 86400) / 3600) + ((Math.floor((((seconds % 31540000) % 604800) % 86400) / 3600) == 1) ? ' hour' : ' hours'));
    if (Math.floor(((((seconds % 31540000) % 604800) % 86400) % 3600) / 60) > 0 || compress == false) parts.push(Math.floor(((((seconds % 31540000) % 604800) % 86400) % 3600) / 60) + ((Math.floor(((((seconds % 31540000) % 604800) % 86400) % 3600) / 60) == 1) ? ' minute' : ' minutes'));
    if (Math.round(((((seconds % 31540000) % 604800) % 86400) % 3600) % 60) > 0 || compress == false) parts.push(Math.round(((((seconds % 31540000) % 604800) % 86400) % 3600) % 60) + ((Math.round(((((seconds % 31540000) % 604800) % 86400) % 3600) % 60) == 1) ? ' second' : ' seconds'));
    return parts.join(', ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Displays information and stats about the bot'),
    async execute(interaction) {
        try {
            const serversPath = path.join(__dirname, '../../');
            const configPath = serversPath + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));
            const now = new Date();
            const memUsage = process.memoryUsage()
            const cpuUsage = process.cpuUsage()
            await interaction.client.guilds.fetch({ limit: 200 });

            await interaction.reply({ embeds: [new EmbedBuilder()
                .setTitle(botConfig.botEmoji + ' ' + botConfig.botName)
                .setDescription('Uses application (`/`) commands')
                .addFields(
                    { name: '🖥️ Servers', value: interaction.client.guilds.cache.size.toString() || '0', inline: true },
                    { name: '📱 Users', value: interaction.client.users.cache.size.toString() || '0', inline: true },
                    { name: '📖 Library', value: '[Discord.js](https://discord.js.org)', inline: true },
                    { name: '🏓 Ping', value: 'Latency is ' + (now - interaction.createdTimestamp) + 'ms\nAPI Latency is ' + interaction.client.ws.ping + 'ms', inline: true },
                    { name: '💽 Memory Usage', value: (Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100).toString() + ' MB', inline: true },
                    { name: '💽 CPU Usage', value: (Math.round(cpuUsage.user * 100) / 100).toString() + '%', inline: true },
                    { name: '⬆️ Uptime', value: prettyTime(process.uptime() * 1000, true) || 'N/A', inline: true }
                )
                .setColor(0xac4af7)
                .setFooter({ text: 'Made by Jessica ♡' })
            ]});
        } catch (error) { console.log(error); }
    }
}