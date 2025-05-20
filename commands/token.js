const { SlashCommandBuilder } = require("discord.js");
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
      // Faz a requisição POST com o código informado
      const response = await axios.post(endpoint, {
        document: codigo,
      });

      const tokenBase64 = response.data.token;

      if (!tokenBase64) {
        return await interaction.reply("Token não encontrado na resposta da API.");
      }

      // Decodifica o token Base64
      const decoded = atob(tokenBase64); // Função nativa do browser/node >= 16+
      const [uuid, cnpj] = decoded.split(":");

      if (!uuid || !cnpj) {
        return await interaction.reply("Erro ao decodificar o token.");
      }

      await interaction.reply(`🔓 **Token decodificado:**\n🆔 UUID: \`${uuid}\`\n🏢 CNPJ: \`${cnpj}\``);

    } catch (error) {
      console.error("Erro ao buscar ou decodificar token:", error.message);
      await interaction.reply("❌ Ocorreu um erro ao buscar ou decodificar o token.");
    }
  },
};
