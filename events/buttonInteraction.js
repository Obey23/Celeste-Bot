const { EmbedBuilder, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const wait = require('util').promisify(setTimeout);

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        try {
            const root = path.join(__dirname, '../');
            const configPath = root + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));

            if (interaction.customId == 'verify-user') {
                await interaction.deferReply();
                const verifyRole = await interaction.guild.roles.resolve(botConfig['verifyRoleId'] || '');
                const userId = interaction.message?.embeds[0]?.footer?.text?.slice(9);
                const member = await interaction.guild.members.resolve(userId);
                await member.roles.add(verifyRole, 'Verified by ' + interaction.user.username + ' (' + interaction.user.id + ')');
                await member.send({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('Your verification request has been approved.')
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
                await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setDescription(member.toString() + ' has been given the ' + verifyRole.toString() + ' role successfully.\n\nDeleting channel in 5 seconds...')
                    .setColor(0xffffff)
                ]});
                await wait(5 * 1000);
                await interaction.channel.delete('User was verified');
            } else if (interaction.customId == 'no-verify-user') {
                await interaction.deferReply();
                const userId = interaction.message?.embeds[0]?.footer?.text?.slice(9);
                const member = await interaction.guild.members.resolve(userId);
                await member.send({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('Your verification request has been denied.')
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
                await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setDescription(member.toString() + ' has been notified that their request was declined.\n\nDeleting channel in 5 seconds...')
                    .setColor(0xffffff)
                ]});
                await wait(5 * 1000);
                await interaction.channel.delete('User was not verified');
            }
        } catch (error) { console.log(error); }
    }
};