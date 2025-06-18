const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Conexão com o Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Consulta informações de uma loja pelo CNPJ ou Store ID')
        .addStringOption(option =>
            option.setName('documento')
                .setDescription('CNPJ da loja (somente números)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('storeid')
                .setDescription('ID interno da loja no sistema')
                .setRequired(false)
        ),

    async execute(interaction) {
        const cnpj = interaction.options.getString('documento');
        const storeId = interaction.options.getString('storeid');

        // Validação: precisa escolher pelo menos um
        if (!cnpj && !storeId) {
            return await interaction.reply('❌ Por favor, forneça **documento** ou **storeId** para buscar.');
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

        const { data, error } = await query;

        if (error || !data) {
            return await interaction.reply('❌ Loja não encontrada ou erro ao consultar os dados.');
        }

        const loja = data;

        // Segunda consulta: dados do programa da loja
        const { data: rede, error: erroRede } = await supabase
            .from('BD_Core_Programs') // ou 'rede', dependendo do nome real da tabela
            .select('*')
            .eq('id', loja.programId)
            .single();

        if (erroRede || !rede) {
            return await interaction.reply('❌ Loja encontrada, mas erro ao consultar os dados do programa.');
        }

        const statusLoja = loja.status === true ? '✅ Ativa' : '❌ Inativa';
        // const statusRede = rede.status === true ? '✅ Ativa' : '❌ Inativa';

        const lojaEmbed = new EmbedBuilder()
            .setTitle('🏪 Informações da Loja')
            .setColor(0x2b8cc4)
            .setThumbnail(rede.image_url || undefined)
            .addFields(
                { name: '🆔 Store ID', value: `\`\`\`${loja.id}\`\`\``, inline: false },
                { name: '📄 CNPJ', value: `\`\`\`${loja.document}\`\`\``, inline: false },
                { name: '🏷️ Nome', value: `\`\`\`${loja.name || 'Não informado'}\`\`\``, inline: false },
                { name: '🔗 Programa ID', value: `\`\`\`${loja.programId || 'N/D'}\`\`\``, inline: false },
                { name: '🏷️ Nome da Rede', value: `\`${rede.name || 'Não informado'}\``, inline: false },
                { name: '📶 Status da Loja', value: statusLoja, inline: true },
                { name: '🧩 Segmento', value: `\`${rede.segment || 'N/D'}\``, inline: true },
                { name: '👤 CSM', value: `\`${rede.CSM || 'N/D'}\``, inline: true },
                { name: '🏷️ White Label', value: rede.is_white_label ? 'Sim' : 'Não', inline: true }
            )

        await interaction.reply({ embeds: [lojaEmbed] });
    },
};
