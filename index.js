require("dotenv").config();
const fs = require("fs");
const path = require("path");
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
  console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Erro ao executar comando:", error);
    await interaction.reply({ content: "Erro ao executar comando.", ephemeral: true });
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||                             
    !message.mentions.users.has(client.user.id) ||    // Ignora se o bot não for mencionado diretamente
    message.mentions.everyone                         // Ignora @everyone e @here
  ) return;

  // Extrai a pergunta removendo a menção
  const pergunta = message.content.replace(/<@!?(\d+)>/, '').trim();

  if (!pergunta) {
    return message.reply("👋 Me mencione com uma pergunta, exemplo: `@PetrinhoIA como está o tempo?`");
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


client.login(process.env.DISCORD_BOT_TOKEN);
