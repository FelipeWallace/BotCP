const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Faz uma pergunta para a IA via n8n")
    .addStringOption(option =>
      option
        .setName("pergunta")
        .setDescription("Escreva sua dúvida")
        .setRequired(true)
    ),
  async execute(interaction) {
    const axios = require("axios");
    const webhook = process.env.N8N_WEBHOOK;

    const pergunta = interaction.options.getString("pergunta");

    try {
      const res = await axios.post(webhook, {
        pergunta: pergunta,
        // user: interaction.user.username,
        // channelId: interaction.channel.id,
        userId: interaction.user.id,
      });

      // const resposta = res.data.resposta || "Não consegui uma resposta.";
      const resposta = res.data.resposta || "Pensando...";
      await interaction.reply(resposta);
    } catch (err) {
      console.error("Erro ao chamar o webhook:", err.message);
      await interaction.reply("Erro ao tentar obter a resposta da IA.");
    }
  },
};
