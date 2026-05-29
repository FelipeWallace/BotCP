const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

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
    await interaction.deferReply();

    const webhook = process.env.N8N_WEBHOOK;
    const pergunta = interaction.options.getString("pergunta");

    try {
      const res = await axios.post(webhook, {
        pergunta,
        userId: interaction.user.id,
      });

      const resposta = res.data.resposta || "Pensando...";
      await interaction.editReply(resposta);
    } catch (err) {
      console.error("Erro ao chamar o webhook:", err.message);
      await interaction.editReply("Erro ao tentar obter a resposta da IA.");
    }
  },
};
