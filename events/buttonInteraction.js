const { EmbedBuilder, Events, PermissionOverwrites, ChannelType, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, PermissionFlagsBits, Collection, ModalBuilder, TextDisplayBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
            const botConfig = (fs.existsSync(configPath)) ? JSON.parse(fs.readFileSync(configPath)) : {};

            const ticketDataPath = root + 'ticketData.json';
            const ticketData = (fs.existsSync(ticketDataPath)) ? JSON.parse(fs.readFileSync(ticketDataPath)) : {};

            if (interaction.customId == 'verify-user') {
                await interaction.deferReply();
                const verifyRole = await interaction.guild.roles.resolve(botConfig['verifyRoleId'] || '');
                const userId = interaction.message?.embeds[0]?.footer?.text?.slice(9);
                const member = await interaction.guild.members.resolve(userId);
                if (!member) {
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setDescription('The user has left the guild and therefore cannot be verified.\n\nDeleting channel in 30 seconds...')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(30 * 1000);
                    return await interaction.channel.delete('User left the guild');
                }
                await member.roles.add(verifyRole, 'Verified by ' + interaction.user.username + ' (' + interaction.user.id + ')');
                const msg = await member.send({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('Your verification request has been approved.')
                    .setColor(0xffffff)
                    .setTimestamp()
                ]}).catch(error => { return; });
                if (!msg) {
                    await interaction.editReply({ embeds: [ new EmbedBuilder()
                        .setDescription('I was unable to DM the user their verification response')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await interaction.followUp({ embeds: [ new EmbedBuilder()
                        .setDescription(member.toString() + ' has been given the ' + verifyRole.toString() + ' role successfully.\n\nDeleting channel in 30 seconds...')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(30 * 1000);
                } else {
                    await interaction.editReply({ embeds: [ new EmbedBuilder()
                        .setDescription(member.toString() + ' has been given the ' + verifyRole.toString() + ' role successfully.\n\nDeleting channel in 5 seconds...')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(5 * 1000);
                }
                await interaction.channel.delete('User was verified by ' + interaction.user.username);
            } else if (interaction.customId == 'no-verify-user') {
                await interaction.deferReply();
                const userId = interaction.message?.embeds[0]?.footer?.text?.slice(9);
                const member = await interaction.guild.members.resolve(userId);
                if (!member) {
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setDescription('The user has left the guild and therefore cannot be verified.\n\nDeleting channel in 30 seconds...')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(30 * 1000);
                    return await interaction.channel.delete('User left the guild');
                }
                const modal = new ModalBuilder()
                    .setCustomId('no-verify-user')
                    .setTitle('Deny Request')
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('You can optionally add a reason for denying the user\'s verification request.'),
                        new TextDisplayBuilder().setContent('This reason message will be sent to the user.'))
                    .addLabelComponents(
                        new LabelBuilder()
                            .setLabel('Reason for denying')
                            .setTextInputComponent(
                                new TextInputBuilder()
                                    .setCustomId('deny-reason')
                                    .setRequired(false)
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Account too new')
                                    .setMaxLength(1014)
                            )
                    );
                await interaction.showModal(modal);
            } else if (interaction.customId == 'ticket-open') {
                const type = (await interaction.client.ticketTempData.get(interaction.user.id))?.ticketType;
                if (!type) {
                    return await interaction.reply({ embeds: [new EmbedBuilder()
                        .setTitle('🎫 Tickets')
                        .setDescription('Please select a ticket type to open a ticket.')
                        .setColor(0xffffff)
                    ], flags: MessageFlags.Ephemeral });
                }
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const ticketCategory = await interaction.guild.channels.resolve(botConfig['ticketCategoryId']);
                const supportRole = await interaction.guild.roles.resolve(botConfig['supportRoleId']);
                const ticket = await interaction.guild.channels.create({
                    name: interaction.user.username,
                    parent: ticketCategory?.id || null,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [ PermissionsBitField.Flags.ViewChannel ]
                        },
                        {
                            id: interaction.user.id,
                            allow: [ PermissionsBitField.Flags.ViewChannel ]
                        }
                    ]
                });

                if (supportRole) {
                    await ticket.permissionOverwrites.create(supportRole.id, { ViewChannel: true })
                }
        
                const pin = await ticket.send({ content: interaction.user.toString() + ' ' + (supportRole?.toString() || ''), embeds: [ new EmbedBuilder()
                    .setTitle('🎫 New Ticket')
                    .setDescription(interaction.user.toString() + ' has opened a ticket')
                    .addFields({ name: 'Type', value: type })
                    .setColor(0xffffff)
                    .setTimestamp()
                ], components: [ new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket-close')
                        .setLabel('Close')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Primary)
                )]});
                await pin.pin();

                ticketData[ticket.id] = {
                    "creatorId": interaction.user.id,
                    "type": type
                }

                fs.writeFileSync(ticketDataPath, JSON.stringify(ticketData));
                interaction.client.ticketTempData.delete(interaction.user.id);

                await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setDescription('Ticket opened: ' + ticket.toString())
                    .setColor(0xffffff)
                ]});
            } else if (interaction.customId == 'ticket-close') {
                const supportRole = await interaction.guild.roles.resolve(botConfig['supportRoleId']);
                if (ticketData[interaction.channel.id]['creatorId'] == interaction.user.id || interaction.member.roles.has(supportRole) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setTitle('🎫 Tickets')
                        .setDescription('Ticket closing in 5 seconds...')
                        .setFooter({ text: 'Closed by ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(5000);
                    await interaction.channel.delete({ reason: 'Ticket closed by ' + interaction.user.username });
                } else {
                    await interaction.reply({ embeds: [ new EmbedBuilder()
                        .setTitle('🎫 Tickets')
                        .setDescription('Only the creator of this ticket or moderators can close it!')
                        .setColor(0xffffff)
                    ], flags: MessageFlags.Ephemeral });
                }
            }
        } catch (error) { console.log(error); }
    }
};