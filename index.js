require("dotenv").config();

const REQUIRED_ENV_VARS = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_GUILD_ID',
  'N8N_WEBHOOK',
  'SUPABASE_CLIENTES_URL',
  'SUPABASE_CLIENTES_ANON_KEY',
  'SUPABASE_GESTAO_URL',
  'SUPABASE_GESTAO_ANON_KEY',
  'TOKEN_ENDPOINT',
  'PIN_ENDPOINT',
];

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente obrigatórias ausentes:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

const fs = require("fs");
const path = require("path");
const http = require("http");
const axios = require("axios");
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log('─────────────────────────────────────');
  console.log(`✅ Bot online!`);
  console.log(`   Tag:       ${client.user.tag}`);
  console.log(`   Servidores: ${client.guilds.cache.size}`);
  console.log(`   Comandos:  ${client.commands.size}`);
  console.log(`   Iniciado:  ${timestamp}`);
  console.log('─────────────────────────────────────');
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Erro ao executar comando:", error);
    const reply = { content: "Erro ao executar comando.", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||                             // Ignora mensagens de bots
    !message.mentions.users.has(client.user.id) ||    // Ignora se o bot não for mencionado diretamente
    message.mentions.everyone                         // Ignora @everyone e @here
  ) return;

  // Extrai a pergunta removendo a menção
  const pergunta = message.content.replace(/<@!?(\d+)>/, '').trim();

  if (!pergunta) {
    return message.reply("👋 Me mencione com uma pergunta");
  }

  try {
    // Chamada para seu webhook ou sistema de IA
    const resposta = await enviarProWebhook(pergunta, message.author.id);
    await message.reply(resposta);
  } catch (err) {
    console.error("Erro ao buscar resposta:", err);
    await message.reply("❌ Tive um erro ao processar sua pergunta.");
  }
});

async function enviarProWebhook(pergunta, userId) {
  const response = await axios.post(process.env.N8N_WEBHOOK, {
    pergunta,
    userId
  });

  return response.data.resposta || "🤖 Pensando...";
}


process.on('unhandledRejection', (error) => {
  console.error('❌ Erro não tratado:', error);
});

const shutdown = (signal) => {
  console.log(`\n⚠️  Sinal ${signal} recebido. Encerrando bot...`);
  client.destroy();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

client.login(process.env.DISCORD_BOT_TOKEN);

// Servidor HTTP para manter o serviço ativo no Render (keep-alive via UptimeRobot)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const uptime = process.uptime();
  const horas = Math.floor(uptime / 3600);
  const minutos = Math.floor((uptime % 3600) / 60);
  const segundos = Math.floor(uptime % 60);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    bot: client.user?.tag ?? 'carregando...',
    servidores: client.guilds.cache.size,
    comandos: client.commands.size,
    uptime: `${horas}h ${minutos}m ${segundos}s`,
  }));
}).listen(PORT, () => {
  console.log('─────────────────────────────────────');
  console.log(`🌐 Keep-alive ativo na porta ${PORT}`);
  console.log('─────────────────────────────────────');
});
