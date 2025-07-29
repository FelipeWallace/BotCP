const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pin')
    .setDescription('Consulta o PIN para o telefone informado')
    .addStringOption(option =>
      option.setName('telefone')
        .setDescription('Número do telefone com ou sem DDI (55)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const telefoneInput = interaction.options.getString('telefone').replace(/\D/g, ''); // remove tudo que não é número

    // Adiciona 55 se não tiver
    let telefoneFormatado = telefoneInput.startsWith('55')
      ? telefoneInput
      : '55' + telefoneInput;

    // Validação de tamanho (Brasil: 13 dígitos com DDI)
    if (telefoneFormatado.length !== 13) {
      return await interaction.reply({
        content: '❌ Número inválido. O formato correto é DDI+DDD+Número (ex: 5511999999999).',
      });
    }

    try {
      // Chama o endpoint
      const response = await axios.post(process.env.PIN_ENDPOINT, {
        cellPhone: telefoneFormatado
      });

      const token = response.data.token || null;

      if (!token || token.length !== 6) {
        return await interaction.reply({
          content: '❌ PIN não encontrado.',
        });
      }

      // Criar embed
      const embed = new EmbedBuilder()
        .setTitle('🔐 PIN Gerado com Sucesso')
        .setColor(0x2b8cc4)
        .addFields(
          { name: '📞 Telefone', value: `\`\`\`\n${telefoneFormatado}\n\`\`\``, inline: false },
          { name: '📌 PIN', value: `\`\`\`\n${token}\n\`\`\``, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed]});

    } catch (error) {
      console.error('Erro ao gerar PIN:', error.message);
      await interaction.reply({
        content: '❌ Erro ao comunicar com o servidor.',
        ephemeral: true
      });
    }
  }
};
