import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} from "discord.js";
import triviaCommand from "./commands/trivia.js";
import leaderboardCommand from "./commands/leaderboard.js";
import statsCommand from "./commands/stats.js";
import categoriesCommand from "./commands/categories.js";
import streakCommand from "./commands/streak.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load commands
const commands = [
  {
    name: triviaCommand.name,
    description: triviaCommand.description,
  },
  {
    name: leaderboardCommand.name,
    description: leaderboardCommand.description,
  },
  {
    name: statsCommand.name,
    description: statsCommand.description,
  },
  {
    name: categoriesCommand.name,
    description: categoriesCommand.description,
  },
  {
    name: streakCommand.name,
    description: streakCommand.description,
  },
];

client.commands = new Collection();
client.commands.set(triviaCommand.name, triviaCommand);
client.commands.set(leaderboardCommand.name, leaderboardCommand);
client.commands.set(statsCommand.name, statsCommand);
client.commands.set(categoriesCommand.name, categoriesCommand);
client.commands.set(streakCommand.name, streakCommand);

// Deploy commands and start bot
async function initialize() {
  try {
    console.log("Started refreshing application (/) commands.");
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");

    await client.login(process.env.TOKEN);
    console.log(`✅ Logged in as ${client.user.tag}`);
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

client.once("ready", () => {
  console.log(
    `✅ Bot is ready and serving ${client.guilds.cache.size} servers`
  );
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction);
  } catch (error) {
    console.error("Command execution error:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({
          content: "There was an error executing this command!",
          ephemeral: true,
        })
        .catch(console.error);
    }
  }
});

// Handle any unhandled errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

initialize();
