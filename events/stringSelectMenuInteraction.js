const { EmbedBuilder, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const wait = require('util').promisify(setTimeout);

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        try {
            if (interaction.customId == 'ticket-type') {
                await interaction.deferUpdate();
                interaction.client.ticketTempData.set(interaction.user.id,
                    {
                        "ticketType": interaction.values[0]
                    }
                )
            }
        } catch (error) { console.log(error); }
    }
};