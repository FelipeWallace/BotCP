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
    await interaction.deferReply({ flags: 64 });

    let telefoneInput = interaction.options.getString('telefone').replace(/\D/g, '');

    if (telefoneInput.length === 11) {
      telefoneInput = '55' + telefoneInput;
    } else if (telefoneInput.startsWith('55') && telefoneInput.length === 11) {
      // DDD 55 (RS) sem DDI
      telefoneInput = '55' + telefoneInput;
    } else if (!telefoneInput.startsWith('55') || telefoneInput.length !== 13) {
      return await interaction.editReply({
        content: '❌ Número inválido. O formato correto é DDI+DDD+Número (ex: 5511999999999).'
      });
    }

    const telefoneFormatado = telefoneInput;

    try {
      const response = await axios.post(process.env.PIN_ENDPOINT, {
        cellPhone: telefoneFormatado
      });

      const token = response.data.token || null;

      if (!token || token.length !== 6) {
        return await interaction.editReply({
          content: '❌ PIN não encontrado.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔐 PIN Gerado com Sucesso')
        .setColor(0x2b8cc4)
        .addFields(
          { name: '📞 Telefone', value: `\`\`\`\n${telefoneFormatado}\n\`\`\``, inline: false },
          { name: '📌 PIN', value: `\`\`\`\n${token}\n\`\`\``, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao gerar PIN:', error.message);
      await interaction.editReply({
        content: '❌ Erro ao comunicar com o servidor.'
      });
    }
  }
};
