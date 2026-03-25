const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings for features')
        .addSubcommandGroup(group => group
            .setName('verification')
            .setDescription('Settings all linked to the verification process')
            .addSubcommand(subcommand => subcommand
                .setName('category')
                .setDescription('The category which new verification requests will be added under')
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('Your verification category')
                    .addChannelTypes([ ChannelType.GuildCategory ])
                )
            )
            .addSubcommand(subcommand => subcommand
                .setName('role')
                .setDescription('The role which verified users should receive')
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('Your verified role')
                )
            )
            .addSubcommand(subcommand => subcommand
                .setName('mod-role')
                .setDescription('The role which should be able to accept or deny verification requests')
                .addRoleOption(option => option
                    .setName('mod-role')
                    .setDescription('Your moderation role')
                )
            )
        )
        .addSubcommandGroup(group => group
            .setName('tickets')
            .setDescription('Settings all linked to the ticket system')
            .addSubcommand(subcommand => subcommand
                .setName('category')
                .setDescription('The category which new tickets will be added under')
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('Your ticket category')
                    .addChannelTypes([ ChannelType.GuildCategory ])
                )
            )
            .addSubcommand(subcommand => subcommand
                .setName('support-role')
                .setDescription('The role which should be able to view tickets')
                .addRoleOption(option => option
                    .setName('support-role')
                    .setDescription('Your support role')
                )
            )
        ),
    async execute(interaction) {
        try {
            const root = path.join(__dirname, '../../');
            const configPath = root + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));

            const subcommandGroup = await interaction.options.getSubcommandGroup();
            const subcommand = await interaction.options.getSubcommand();

            const link = [subcommandGroup, subcommand].join('-')
            const crossmap = {
                'verification-category': 'verifyCategoryId',
                'verification-role': 'verifyRoleId',
                'verification-mod-role': 'modRoleId',
                'tickets-category': 'ticketCategoryId',
                'tickets-support-role': 'supportRoleId'
            };
            var value;
            var valueDisplay;
            var previous;
            var previousDisplay;
            
            if (['verification-category', 'tickets-category'].includes(link)) { // Channel Based
                value = await interaction.options.getChannel(subcommand, false);
                valueDisplay = value?.name;
                previous = await interaction.guild.channels.resolve(botConfig[crossmap[link]]);
                previousDisplay = previous?.name;
            } else if (['verification-role', 'verification-mod-role', 'tickets-support-role'].includes(link)) { // Role Based
                value = await interaction.options.getRole(subcommand, false);
                valueDisplay = value?.toString();
                previous = await interaction.guild.roles.resolve(botConfig[crossmap[link]]);
                previousDisplay = previous?.toString();
            }

            if (value) {
                botConfig[crossmap[link]] = value.id;
                fs.writeFileSync(configPath, JSON.stringify(botConfig));
                await interaction.reply({ embeds: [ new EmbedBuilder()
                    .setTitle('🔧 Config')
                    .setDescription(`Updated the value of \`${subcommandGroup} -> ${subcommand}\``)
                    .addFields(
                        { name: 'Previous', value: previousDisplay || 'N/A', inline: true },
                        { name: 'New Value', value: valueDisplay, inline: true }
                    )
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
            } else {
                await interaction.reply({ embeds: [ new EmbedBuilder()
                    .setTitle('🔧 Config')
                    .setDescription(`Showing the value of \`${subcommandGroup} -> ${subcommand}\``)
                    .addFields(
                        { name: 'Value', value: previousDisplay || 'N/A', inline: true }
                    )
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
            }
        } catch (error) { console.log(error); }
    }
}