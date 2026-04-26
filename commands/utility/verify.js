const { MessageFlags, SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Creates a ticket with our moderation team to verify your age.')
        .addAttachmentOption(option => option
            .setName('identification')
            .setDescription('Please attach your ID. (passport, drivers license, etc.) We only need your DOB and the ID\'s origin')
            .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const root = path.join(__dirname, '../../');
            const configPath = root + 'config.json';
            const botConfig = JSON.parse(fs.readFileSync(configPath || {}));

            const verifyCategory = await interaction.guild.channels.resolve(botConfig['verifyCategoryId'] || '');
            const modRole = await interaction.guild.roles.resolve(botConfig['modRoleId'] || '');
            const verifyRole = await interaction.guild.roles.resolve(botConfig['verifyRoleId'] || '');
            const member = await interaction.guild.members.resolve(interaction.user);
            const identification = await interaction.options.getAttachment('identification');
            let errorMessage;

            if (!verifyCategory || verifyCategory.type !== ChannelType.GuildCategory) {
                errorMessage = 'The `verifyCategoryId` value has not been defined correctly in the bot\'s config';
            } else if (!modRole) {
                errorMessage = 'The `modRoleId` value has not been defined correctly in the bot\'s config';
            } else if (!verifyRole) {
                errorMessage = 'The `verifyRoleId` value has not been defined correctly in the bot\'s config'; 
            } else if (!identification.contentType.startsWith('image/')) {
                errorMessage = 'Your provided identification is not an image.';
            } else if (interaction.guild.channels.cache.find(c => c.name == interaction.user.username && c.parent == verifyCategory )) {
                errorMessage = 'You already have an open verification request.'
            } else if (member.roles.cache.find(r => r.id == verifyRole.id)) {
                errorMessage = 'You are already verified!'
            };

            if (errorMessage) {
                await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('There was an error while running this command')
                    .addFields({ name: 'Message', value: errorMessage })
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
            } else {
                const verifyChannel = await interaction.guild.channels.create({
                    name: interaction.user.username,
                    parent: verifyCategory.id,
                    type: ChannelType.GuildText
                });
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verify-user')
                        .setEmoji('✅')
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('no-verify-user')
                        .setEmoji('⛔')
                        .setLabel('Decline')
                        .setStyle(ButtonStyle.Danger)
                )
                await verifyChannel.send({ content: modRole.toString(), embeds: [ new EmbedBuilder()
                    .setTitle('User Age Verification')
                    .addFields(
                        { name: 'User', value: interaction.user.toString(), inline: true },
                        { name: 'Account Created', value: new Date(interaction.user.createdTimestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) + ' (<t:' + Math.round(interaction.user.createdTimestamp / 1000) + ':R>)', inline: true },
                        { name: 'Joined Server', value: new Date(member.joinedTimestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) + ' (<t:' + Math.round(member.joinedTimestamp / 1000) + ':R>)', inline: true },
                        { name: 'Roles (' + ((member.roles.cache.size > 0) ? member.roles.cache.size - 1 : 0).toString() + ')', value: member.roles.cache.filter(r => r != interaction.guild.roles.everyone).sort(function(a,b){ return +b.position - +a.position }).map(r => r.toString()).join(', ') || '`No Roles`' }
                    )
                    .setFooter({ text: 'User ID: ' + interaction.user.id })
                    .setImage('attachment://' + identification.name)
                    .setColor(0xffffff)
                    .setTimestamp()
                ], files: [ identification ], components: [ row ] });
                await interaction.user.send({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('We have received your verification request. Our moderation team will review it and either accept or deny your request.\n\nYou will receive a private message once your request has been processed.')
                    .setColor(0xffffff)
                    .setTimestamp()
                ]}).catch(error => { return; });
                await interaction.editReply({ embeds: [ new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('We have received your verification request. Our moderation team will review it and either accept or deny your request.\n\nYou will receive a private message once your request has been processed.')
                    .setColor(0xffffff)
                    .setTimestamp()
                ]});
            }
        } catch (error) { console.log(error); }
    }
}