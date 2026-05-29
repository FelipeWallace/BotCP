const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { supabaseClientes, supabaseGestao } = require('../lib/supabase');
const dayjs = require('dayjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Consulta tickets em andamento de uma loja')
        .addStringOption(option =>
            option.setName('documento')
                .setDescription('CNPJ da loja (com ou sem máscara)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('storeid')
                .setDescription('ID interno da loja no sistema')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        try {
            let id = interaction.options.getString('storeid');
            let documento = interaction.options.getString('documento');

            if (!id && !documento) {
                return await interaction.editReply({
                    content: '❌ Forneça **documento** ou **storeId** para buscar.'
                });
            }

            if (documento) {
                documento = documento.replace(/\D/g, '');
            }

            let finalId = id;
            let storeName = '';

            if (!finalId && documento) {
                const { data: storeData, error: storeError } = await supabaseClientes
                    .from('BD_Core_Stores')
                    .select('id, name')
                    .eq('document', documento)
                    .single();

                if (storeError || !storeData) {
                    return await interaction.editReply({
                        content: '❌ Documento não encontrado.'
                    });
                }

                finalId = storeData.id;
                storeName = storeData.name;
            } else if (finalId) {
                const { data: storeData } = await supabaseClientes
                    .from('BD_Core_Stores')
                    .select('name')
                    .eq('id', finalId)
                    .single();

                if (storeData) storeName = storeData.name;
            }

            const { data: ticketsLoja } = await supabaseGestao
                .from('BD_Tickets')
                .select('custom_ID, titulo_ticket, data_criacao, status, url_Card, lista')
                .eq('store_ID', finalId)
                .neq('status', 'FINALIZADO')
                .neq('status', 'FINALIZADO N2')
                .order('data_criacao', { ascending: false })
                .limit(10);

            // Cria embed simples
            const embed = new EmbedBuilder()
                .setTitle(`📄 Tickets em andamento`)
                .setColor(0x2b8cc4)
                .setTimestamp();

            embed.addFields({
                name: storeName ? `🏪 ${storeName}` : '🏪 Loja',
                value: ticketsLoja?.length
                    ? ticketsLoja.map(t =>
                        `**${t.custom_ID}** - ${t.titulo_ticket}\nAberto em: ${dayjs(t.data_criacao).format('DD/MM/YYYY')}\n ${t.status.toUpperCase()} - ${t.lista} \n🔗 ${t.url_Card}`
                    ).join('\n\n')
                    : 'Nenhum ticket em andamento.'
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Erro ao executar comando.');
        }
    }
};
