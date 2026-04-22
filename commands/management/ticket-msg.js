const { SlashCommandBuilder, ChannelType, PermissionsBitField, PermissionFlagsBits, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-msg')
        .setDescription('Sends the ticket message into a channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('An optional external channel')
            .addChannelTypes([ ChannelType.GuildText, ChannelType.GuildAnnouncement ])
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral })
            const channel = await interaction.options.getChannel('channel', false) || interaction.channel;
            const permissions = channel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setTitle('🎫 Tickets')
                    .setDescription('Setting up tickets requires `SendMessages` and `EmbedLinks` permissions in the channel which you are using.')
                    .setColor(0xffffff)
                ]});
            }

            const rows = [ new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket-type')
                    .setRequired(true)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .setOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Support')
                            .setValue('Support')
                            .setDescription('General support ticket to discuss with staff'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Report')
                            .setValue('Report')
                            .setDescription('Report a user or problem to our team'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Misc')
                            .setValue('Misc')
                            .setDescription('Miscellaneous ticket where you still need the staff team\'s input directly')
                    ])
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket-open')
                    .setLabel('Open Ticket')
                    .setStyle(ButtonStyle.Success)
            )]

            const msg = await channel.send({ embeds: [ new EmbedBuilder()
                .setTitle('🎫 Tickets')
                .setDescription('Use the select menu below to pick a ticket type. Once done, press the Open Ticket button!')
                .setColor(0xffffff)
            ], components: rows });

            await interaction.editReply({ embeds: [ new EmbedBuilder()
                .setTitle('🎫 Tickets')
                .setDescription('Successfully sent the ticket message!')
                .setColor(0xffffff)
            ], components: [ new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Jump to message')
                    .setStyle(ButtonStyle.Link)
                    .setURL(msg.url)
            )]});
        } catch (error) { console.log(error); }
    }
}