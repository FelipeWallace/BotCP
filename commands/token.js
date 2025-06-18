const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("token")
    .setDescription("Obtém e decodifica o token da loja via API")
    .addStringOption(option =>
      option
        .setName("codigo")
        .setDescription("Código de loja")
        .setRequired(true)
    ),

  async execute(interaction) {
    const codigo = interaction.options.getString("codigo");
    const endpoint = process.env.TOKEN_ENDPOINT;

    try {
      // Defer reply para evitar timeout
      await interaction.deferReply();

      // Faz a requisição POST com o código informado
      const response = await axios.post(endpoint, {
        document: codigo,
      });

      const tokenBase64 = response.data.token;

      if (!tokenBase64) {
        return await interaction.editReply("Token não encontrado na resposta da API.");
      }

      // Decodifica o token Base64
      const decoded = Buffer.from(tokenBase64, "base64").toString("utf-8");
      const [uuid, cnpj] = decoded.split(":");

      if (!uuid || !cnpj) {
        return await interaction.editReply("Erro ao decodificar o token.");
      }

      const embed = new EmbedBuilder()
        .setTitle("🔓 Token decodificado")
        .setColor(0x2ecc71)
        .addFields(
          {
            name: "🆔 UUID",
            value: `\`\`\`\n${uuid}\n\`\`\``,
            inline: false
          },
          {
            name: "⛽ CNPJ",
            value: `\`\`\`\n${cnpj}\n\`\`\``,
            inline: false
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Erro ao buscar ou decodificar token:", error.message);
      if (interaction.deferred) {
        await interaction.editReply("❌ Ocorreu um erro ao buscar ou decodificar o token.");
      } else {
        await interaction.reply("❌ Ocorreu um erro ao buscar ou decodificar o token.");
      }
    }
  },
};
