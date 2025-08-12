const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_CLIENTES_URL,
  process.env.SUPABASE_CLIENTES_ANON_KEY
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Consulta informações de uma loja pelo CNPJ ou Store ID')
    .addStringOption(option =>
      option.setName('documento')
        .setDescription('CNPJ da loja (com ou sem máscara)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('storeid')
        .setDescription('ID interno da loja no sistema')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    let cnpj = interaction.options.getString('documento');
    const storeId = interaction.options.getString('storeid');

    if (!cnpj && !storeId) {
      return await interaction.editReply('❌ Por favor, forneça **documento** ou **storeId** para buscar.');
    }

    if (cnpj) {
      cnpj = cnpj.replace(/\D/g, '');

      if (cnpj.length !== 14) {
        return await interaction.editReply('❌ CNPJ inválido.');
      }
    }

    let query;

    if (cnpj) {
      query = supabase
        .from('BD_Core_Stores')
        .select('*')
        .eq('document', cnpj)
        .single();
    } else if (storeId) {
      query = supabase
        .from('BD_Core_Stores')
        .select('*')
        .eq('id', storeId)
        .single();
    }

    const { data: loja, error } = await query;

    if (error || !loja) {
      const erroEmbed = new EmbedBuilder()
        .setTitle("❌ Loja não encontrada")
        .setDescription("Verifique se o CNPJ ou Store ID estão corretos.")
        .setColor(0xed4245);
      return await interaction.editReply({ embeds: [erroEmbed] });
    }

    const { data: rede, error: erroRede } = await supabase
      .from('BD_Core_Programs')
      .select('*')
      .eq('id', loja.programId)
      .single();

    if (erroRede || !rede) {
      const erroEmbed = new EmbedBuilder()
        .setTitle("⚠️ Loja encontrada, mas erro ao buscar programa")
        .setDescription("A loja foi localizada, mas não foi possível buscar os dados da rede associada.")
        .setColor(0xf1c40f);
      return await interaction.editReply({ embeds: [erroEmbed] });
    }

    const statusLoja = loja.status === true ? '✅ Ativa' : '❌ Inativa';
    const isWhiteLabel = rede.is_white_label === "true" ? "✅ Sim" : rede.is_white_label === "false" ? "❌ Não" : "⚠️ Não informado";

    const lojaEmbed = new EmbedBuilder()
      .setTitle('🏪 Informações da Loja')
      .setColor(0x2b8cc4)
      .setThumbnail(rede.image_url || null)
      .addFields(
        { name: '🆔 Store ID', value: `\`\`\`${loja.id}\`\`\``, inline: false },
        { name: '📄 CNPJ', value: `\`\`\`${loja.document}\`\`\``, inline: false },
        { name: '🏷️ Nome da Loja', value: `\`\`\`${loja.name || 'Não informado'}\`\`\``, inline: false },
        { name: '🔗 Programa ID', value: `\`\`\`${loja.programId || 'N/D'}\`\`\``, inline: false },
        { name: '🏷️ Nome da Rede', value: `\`${rede.name || 'Não informado'}\``, inline: true },
        { name: '🧩 Segmento', value: `\`${rede.segment || 'N/D'}\``, inline: true },
        { name: '👤 CSM', value: `\`${rede.CSM || 'N/D'}\``, inline: true },
        { name: '📶 Status da Loja', value: statusLoja, inline: true },
        { name: '🏷️ White Label', value: isWhiteLabel, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [lojaEmbed] });
  },
};
