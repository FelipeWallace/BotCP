const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Exibe o status atual do bot'),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const uptime = process.uptime();
        const horas = Math.floor(uptime / 3600);
        const minutos = Math.floor((uptime % 3600) / 60);
        const segundos = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setTitle('🤖 Status do Bot')
            .setColor(0x2b8cc4)
            .addFields(
                { name: '🏷️ Tag', value: `\`${interaction.client.user.tag}\``, inline: true },
                { name: '🌐 Servidores', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
                { name: '⚙️ Comandos', value: `\`${interaction.client.commands.size}\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${horas}h ${minutos}m ${segundos}s\``, inline: true },
                { name: '📶 Latência', value: `\`${interaction.client.ws.ping}ms\``, inline: true },
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
