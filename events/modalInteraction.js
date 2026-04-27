const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        try {
            await interaction.deferReply();
            if (interaction.customId == 'no-verify-user') {
                const reason = interaction.fields.getTextInputValue('deny-reason');
                const userId = interaction.message?.embeds[0]?.footer?.text?.slice(9);
                const member = await interaction.guild.members.resolve(userId);

                const embed = new EmbedBuilder()
                    .setTitle('🔞 Verify')
                    .setDescription('Your verification request has been denied.')
                    .setColor(0xffffff)
                    .setTimestamp();
                if (reason) embed.addFields({ name: 'Reason', value: '```\n' + reason + '\n```' })
                const msg = await member.send({ embeds: [ embed ]}).catch(error => { return; });
                if (!msg) {
                    await interaction.editReply({ embeds: [ new EmbedBuilder()
                        .setDescription('I was unable to DM ' + member.toString() + ' about their verification response.' + ((reason) ? '\nYou might want to DM the user yourself with your reason that I have added below.' : '') + '\n\nDeleting channel in 60 seconds...')
                        .addFields((reason) ? { name: 'Reason', value: '```\n' + reason + '\n```' } : null)
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(60 * 1000);
                } else {
                    await interaction.editReply({ embeds: [ new EmbedBuilder()
                        .setDescription(member.toString() + ' has been notified that their request was declined.\n\nDeleting channel in 5 seconds...')
                        .setFooter({ text: 'By: ' + interaction.user.username })
                        .setColor(0xffffff)
                    ]});
                    await wait(5 * 1000);
                }
                await interaction.channel.delete('User was rejected by ' + interaction.user.username);
            }
        } catch (error) { console.error(error); }
    },
};