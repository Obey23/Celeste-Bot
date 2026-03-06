const { MessageFlags, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a bot command')
        .addStringOption(option => option
            .setName('command')
            .setDescription('The command that you want to reload')
            .setRequired(true)
        )
        .addBooleanOption(option => option
            .setName('ephemeral')
            .setDescription('If true, only shows there response to you')
        )
        .setIntegrationTypes([ ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall ])
        .setContexts([ InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel ]),
    async execute(interaction) {
        try {
            const root = path.join(__dirname, '../../');
            const configPath = root + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));
            if (botConfig['managementIds'].includes(interaction.user.id)) {
                const commandName = await interaction.options.getString('command', true);
                const ephemeral = await interaction.options.getBoolean('ephemeral');
                const command = await interaction.client.commands.get(commandName);

                if (!command) {
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setTitle('🤖 Reload')
                        .setDescription('No command was found with the name `' + commandName + '`')
                        .setColor(0xffffff)
                    ], flags: (ephemeral) ? MessageFlags.Ephemeral : null });
                } else {
                    const foldersPath = path.join(__dirname, '../');
                    const commandFolders = fs.readdirSync(foldersPath);
                    for (const folder of commandFolders) {
                        const commandsPath = path.join(foldersPath, folder);
                        const filePath = path.join(commandsPath, command.data.name + '.js');
                        if (fs.existsSync(filePath)) {
                            delete require.cache[require.resolve(filePath)];
                            const newCommand = require(filePath);
                            if ('data' in newCommand && 'execute' in newCommand) {
                                await interaction.client.commands.set(newCommand.data.name, newCommand);
                                await interaction.reply({ embeds: [ new EmbedBuilder()
                                    .setTitle('🤖 Reload')
                                    .setDescription('Successfully reloaded command `' + newCommand.data.name + '`')
                                    .setColor(0xffffff)
                                ], flags: (ephemeral) ? MessageFlags.Ephemeral : null });
                                console.log('Successfully reloaded command ' + newCommand.data.name);
                            } else {
                                var reasons = [];
                                if (!('data' in newCommand)) reasons.push('data');
                                if (!('execute' in newCommand)) reasons.push('execute');
                                await interaction.reply({ embeds: [ new EmbedBuilder()
                                    .setTitle('🤖 Reload')
                                    .setDescription('Unable to reload command `' + command.data.name + '`')
                                    .addFields(
                                        { name: 'Error', value: 'The command doesn\'t have any ' + reasons.join(' or ') }
                                    )
                                    .setColor(0xffffff)
                                ], flags: (ephemeral) ? MessageFlags.Ephemeral : null });
                                console.log('[WARNING] The command at ' + filePath + ' is missing a required \'data\' or \'execute\' property.');
                            }
                        }
                    }
                }
            } else {
                await interaction.reply({ embeds: [ new EmbedBuilder()
                    .setTitle('🤖 Reload')
                    .setDescription('Only specific permitted users are able to run this command!')
                    .setColor(0xffffff)
                ], flags: MessageFlags.Ephemeral});
            }
        } catch (error) { console.log(error); }
    }
}