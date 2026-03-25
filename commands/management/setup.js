const { MessageFlags, SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
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
        .setName('setup')
        .setDescription('Helps aid setting up features for the bot')
        .addSubcommand(subcommand => subcommand
            .setName('verification')
            .setDescription('Walks through setting up age verification')
        )
        .addSubcommand(subcommand => subcommand
            .setName('tickets')
            .setDescription('Walks through setting up the ticket system')
        ),
    async execute(interaction) {
        try {
            const root = path.join(__dirname, '../../');
            const configPath = root + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));
            if (interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const subcommand = await interaction.options.getSubcommand();
                if (subcommand == 'verification') {
                    const verifyCategory = await interaction.guild.channels.resolve(botConfig['verifyCategoryId'] || '');
                    const modRole = await interaction.guild.roles.resolve(botConfig['modRoleId'] || '');
                    const verifyRole = await interaction.guild.roles.resolve(botConfig['verifyRoleId'] || '');
                    /* Verify Role */
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setTitle('Setup - Verification')
                        .setDescription((!botConfig['verifyRoleId']) ? `
                        A verify role has not been set up yet!

                        Please ping a role or send it's role id to set it as the verify role.
                        ` : ((!verifyRole) ? `
                        The verify role that is currently set is invalid!

                        Please ping a role or send it's role id to set it as the new role.
                        ` : `
                        The verify role is currently ${verifyRole.toString()}

                        If you'd like to change it, please ping a role or send it's role id to set it as the new role.
                        If you'd like to keep the current role, just say 'skip'
                        `))
                        .setColor(0xffffff)
                        .setTimestamp()
                    ]});
                    const vrCollector = await interaction.channel.createMessageCollector({ filter: m => m.author.id == interaction.user.id, idle: 60000 });
                    await vrCollector.on('collect', async (message) => {
                        if (message.mentions.roles.first()) {
                            await message.react('✅');
                            botConfig['verifyRoleId'] = message.mentions.roles.first().id;
                            vrCollector.stop();
                        } else if (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])) {
                            await message.react('✅');
                            botConfig['verifyRoleId'] = (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])).id;
                            vrCollector.stop();
                        } else if (message.content == 'skip' && verifyRole) {
                            await message.react('✅');
                            vrCollector.stop('skip');
                        } else {
                            await message.react('❌');
                        }
                    });
                    await vrCollector.on('end', async (collected, reason) => {
                        await interaction.editReply({ embeds: [ new EmbedBuilder()
                            .setTitle('Setup - Verification')
                            .setDescription((reason == 'skip') ? 'This step has been skipped.'
                                            : ((reason == 'user') ? 'Role saved successfully.'
                                            : 'This setup process has timed out. Please run the command again to continue.\n\nAny previous changes have been saved.')
                            )
                            .setFooter({ text: 'Step: Verify Role' })
                            .setColor(0xffffff)
                            .setTimestamp()
                        ]});
                        fs.writeFileSync(configPath, JSON.stringify(botConfig));
                        if (reason == 'skip' || reason == 'user') {
                            /* Mod Role */
                            const modMsg = await interaction.channel.send({ embeds: [ new EmbedBuilder()
                                .setTitle('Setup - Verification')
                                .setDescription((!botConfig['modRoleId']) ? `
                                A mod role has not been set up yet!

                                Please ping a role or send it's role id to set it as the mod role.
                                ` : ((!modRole) ? `
                                The mod role that is currently set is invalid!

                                Please ping a role or send it's role id to set it as the new role.
                                ` : `
                                The mod role is currently ${modRole.toString()}

                                If you'd like to change it, please ping a role or send it's role id to set it as the new role.
                                If you'd like to keep the current role, just say 'skip'
                                `))
                                .setColor(0xffffff)
                                .setTimestamp()
                            ]});
                            const mrCollector = await interaction.channel.createMessageCollector({ filter: m => m.author.id == interaction.user.id, idle: 60000 });
                            await mrCollector.on('collect', async (message) => {
                                if (message.mentions.roles.first()) {
                                    await message.react('✅');
                                    botConfig['modRoleId'] = message.mentions.roles.first().id;
                                    mrCollector.stop();
                                } else if (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])) {
                                    await message.react('✅');
                                    botConfig['modRoleId'] = (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])).id;
                                    mrCollector.stop();
                                } else if (message.content == 'skip' && verifyRole) {
                                    await message.react('✅');
                                    mrCollector.stop('skip');
                                } else {
                                    await message.react('❌');
                                }
                            });
                            await mrCollector.on('end', async (collected, reason) => {
                                await modMsg.edit({ embeds: [ new EmbedBuilder()
                                    .setTitle('Setup - Verification')
                                    .setDescription((reason == 'skip') ? 'This step has been skipped.'
                                                    : ((reason == 'user') ? 'Role saved successfully.'
                                                    : 'This setup process has timed out. Please run the command again to continue.\n\nAny previous changes have been saved.')
                                    )
                                    .setFooter({ text: 'Step: Mod Role' })
                                    .setColor(0xffffff)
                                    .setTimestamp()
                                ]});
                                fs.writeFileSync(configPath, JSON.stringify(botConfig));
                                if (reason == 'skip' || reason == 'user') {
                                    /* Verify Category */
                                    const categoryMsg = await interaction.channel.send({ embeds: [ new EmbedBuilder()
                                        .setTitle('Setup - Verification')
                                        .setDescription((!botConfig['verifyCategoryId']) ? `
                                        A category where verification requests go to has not been set up yet!

                                        Please say a category name or send it's id to set it as the verify category.
                                        ` : ((!verifyCategory) ? `
                                        The current category to send verification requests to is invalid!

                                        Please say a channel name or send it's id to set it as the new verify category.
                                        ` : `
                                        The category which verification requests are sent to is currently ${verifyCategory.toString()}

                                        If you'd like to change it, please say a category name or send it's id to set it as the new verify category.
                                        If you'd like to keep the current category, just say 'skip'
                                        `))
                                        .setColor(0xffffff)
                                        .setTimestamp()
                                    ]});
                                    const vcCollector = await interaction.channel.createMessageCollector({ filter: m => m.author.id == interaction.user.id, idle: 60000 });
                                    await vcCollector.on('collect', async (message) => {
                                        const category = await interaction.guild.channels.cache.find(c => c.name == message.content || c.id == message.content);
                                        if (category?.type == ChannelType.GuildCategory) {
                                            await message.react('✅');
                                            botConfig['verifyCategoryId'] = category.id;
                                            vcCollector.stop();
                                        } else if (message.content == 'skip' && verifyCategory) {
                                            await message.react('✅');
                                            vcCollector.stop('skip');
                                        } else {
                                            await message.react('❌');
                                        }
                                    });
                                    await vcCollector.on('end', async (collected, reason) => {
                                        await categoryMsg.edit({ embeds: [ new EmbedBuilder()
                                            .setTitle('Setup - Verification')
                                            .setDescription((reason == 'skip') ? 'This step has been skipped.'
                                                            : ((reason == 'user') ? 'Category saved successfully.'
                                                            : 'This step has timed out and has been skipped. Run the command again to set this option up or edit the config manually.\n\nAny previous changes have been saved.')
                                            )
                                            .setFooter({ text: 'Step: Verify Category' })
                                            .setColor(0xffffff)
                                            .setTimestamp()
                                        ]});
                                        fs.writeFileSync(configPath, JSON.stringify(botConfig));
                                        if (reason == 'skip' || reason == 'user') {
                                            /* Finished */
                                            await interaction.channel.send({ embeds: [ new EmbedBuilder()
                                                .setTitle('Setup - Verification')
                                                .setDescription('Verification is set up and ready to be used!')
                                                .setColor(0xffffff)
                                                .setTimestamp()
                                            ]});
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else if (subcommand == 'tickets') {
                    const ticketCategory = await interaction.guild.channels.resolve(botConfig['ticketCategoryId'] || '');
                    const supportRole = await interaction.guild.roles.resolve(botConfig['supportRoleId'] || '');

                    /* Support Role */
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setTitle('Setup - Tickets')
                        .setDescription((!botConfig['supportRoleId']) ? `
                        A support role has not been set up yet!

                        Please ping a role or send it's role id to set it as the support role.
                        ` : ((!verifyRole) ? `
                        The support role that is currently set is invalid!

                        Please ping a role or send it's role id to set it as the new role.
                        ` : `
                        The support role is currently ${supportRole.toString()}

                        If you'd like to change it, please ping a role or send it's role id to set it as the new role.
                        If you'd like to keep the current role, just say 'skip'
                        `))
                        .setColor(0xffffff)
                        .setTimestamp()
                    ]});
                    const srCollector = await interaction.channel.createMessageCollector({ filter: m => m.author.id == interaction.user.id, idle: 60000 });
                    await srCollector.on('collect', async (message) => {
                        if (message.mentions.roles.first()) {
                            await message.react('✅');
                            botConfig['supportRoleId'] = message.mentions.roles.first().id;
                            srCollector.stop();
                        } else if (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])) {
                            await message.react('✅');
                            botConfig['supportRoleId'] = (await interaction.guild.roles.resolve(message.content.split(/ +/)[0])).id;
                            srCollector.stop();
                        } else if (message.content == 'skip' && verifyRole) {
                            await message.react('✅');
                            srCollector.stop('skip');
                        } else {
                            await message.react('❌');
                        }
                    });
                    await srCollector.on('end', async (collected, reason) => {
                        await interaction.editReply({ embeds: [ new EmbedBuilder()
                            .setTitle('Setup - Tickets')
                            .setDescription((reason == 'skip') ? 'This step has been skipped.'
                                            : ((reason == 'user') ? 'Role saved successfully.'
                                            : 'This setup process has timed out. Please run the command again to continue.\n\nAny previous changes have been saved.')
                            )
                            .setFooter({ text: 'Step: Support Role' })
                            .setColor(0xffffff)
                            .setTimestamp()
                        ]});
                        fs.writeFileSync(configPath, JSON.stringify(botConfig));
                        if (reason == 'skip' || reason == 'user') {
                            /* Verify Category */
                            const categoryMsg = await interaction.channel.send({ embeds: [ new EmbedBuilder()
                                .setTitle('Setup - Tickets')
                                .setDescription((!botConfig['ticketCategoryId']) ? `
                                A category where tickets go to has not been set up yet!

                                Please say a category name or send it's id to set it as the ticket category.
                                ` : ((!verifyCategory) ? `
                                The current category to send tickets to is invalid!

                                Please say a channel name or send it's id to set it as the new ticket category.
                                ` : `
                                The category which tickets are sent to is currently ${ticketCategory.toString()}

                                If you'd like to change it, please say a category name or send it's id to set it as the new ticket category.
                                If you'd like to keep the current category, just say 'skip'
                                `))
                                .setColor(0xffffff)
                                .setTimestamp()
                            ]});
                            const vcCollector = await interaction.channel.createMessageCollector({ filter: m => m.author.id == interaction.user.id, idle: 60000 });
                            await vcCollector.on('collect', async (message) => {
                                const category = await interaction.guild.channels.cache.find(c => c.name == message.content || c.id == message.content);
                                if (category?.type == ChannelType.GuildCategory) {
                                    await message.react('✅');
                                    botConfig['ticketCategoryId'] = category.id;
                                    vcCollector.stop();
                                } else if (message.content == 'skip' && verifyCategory) {
                                    await message.react('✅');
                                    vcCollector.stop('skip');
                                } else {
                                    await message.react('❌');
                                }
                            });
                            await vcCollector.on('end', async (collected, reason) => {
                                await categoryMsg.edit({ embeds: [ new EmbedBuilder()
                                    .setTitle('Setup - Tickets')
                                    .setDescription((reason == 'skip') ? 'This step has been skipped.'
                                                    : ((reason == 'user') ? 'Category saved successfully.'
                                                    : 'This step has timed out and has been skipped. Run the command again to set this option up or edit the config manually.\n\nAny previous changes have been saved.')
                                    )
                                    .setFooter({ text: 'Step: Ticket Category' })
                                    .setColor(0xffffff)
                                    .setTimestamp()
                                ]});
                                fs.writeFileSync(configPath, JSON.stringify(botConfig));
                                if (reason == 'skip' || reason == 'user') {
                                    /* Finished */
                                    await interaction.channel.send({ embeds: [ new EmbedBuilder()
                                        .setTitle('Setup - Tickets')
                                        .setDescription('Tickets are set up and ready to be used!')
                                        .setColor(0xffffff)
                                        .setTimestamp()
                                    ]});
                                }
                            });
                        }
                    });
                }
            } else {
                await interaction.reply({ embeds: [ new EmbedBuilder()
                    .setTitle('Setup')
                    .setDescription('Only members with `MANAGE_GUILD` or `ADMINISTRATOR` permissions can run this command!')
                    .setColor(0xffffff)
                ], flags: MessageFlags.Ephemeral});
            }
        } catch (error) { console.log(error); }
    }
}