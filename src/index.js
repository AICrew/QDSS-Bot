const dotenv = require('dotenv');
dotenv.config({path: './.env'});
// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform you.
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
// We also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const klaw = require("klaw");
const path = require("path");
const tools = require("./base/tools.js");
// Cache
const RedisServer = require('redis-server');
const server = new RedisServer(6379).open();


class QdssBot extends Client {
  constructor(options) {
    super(options);

    // Here we load the config.js file that contains our token and our prefix values.
    this.config = require("./config.js");
    // client.config.token contains the bot's token
    // client.config.prefix contains the message prefix

    // Aliases and commands are put in collections where they can be read from,
    // catalogued, listed, etc.
    this.commands = new Collection();
    this.aliases = new Collection();

    // Now we integrate the use of Evie's awesome Enhanced Map module, which
    // essentially saves a collection to disk. This is great for per-server configs,
    // and makes things extremely easy for this purpose.
    this.settings = new Enmap({ name: "settings", dataDir: "../data" });

    // Requiring the Logger class for easy console logging.
    this.logger = require("./base/Logger.js");

    // Add the database handle to the client object, for ease of access in commands.
    this.database = require("./base/qdss-sqlite.js");

    // Basically just an async shortcut to using a setTimeout. Nothing fancy!
    this.wait = promisify(setTimeout);
  }

  /*
  PERMISSION LEVEL FUNCTION

  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
  command including the VERY DANGEROUS `eval` command!

  */
  permlevel(message) {
    let permlvl = 0;

    const permOrder = this.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  }

  /* 
  COMMAND LOAD AND UNLOAD
  
  To simplify the loading and unloading of commands from multiple locations
  including the index.js load loop, and the reload function, these 2 ensure
  that unloading happens in a consistent manner across the board.
  */

  loadCommand(commandPath, commandName) {
    try {
      const props = new (require(`${commandPath}${path.sep}${commandName}`))(this);
      this.logger.log(`Loading Command: ${props.help.name}. Ã°Å¸â€˜Å’`, "log");
      props.conf.location = commandPath;
      if (props.init) {
        props.init(this);
      }
      this.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        this.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  }

  async unloadCommand(commandPath, commandName) {
    let command;
    if (this.commands.has(commandName)) {
      command = this.commands.get(commandName);
    } else if (this.aliases.has(commandName)) {
      command = this.commands.get(this.aliases.get(commandName));
    }
    if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;

    if (command.shutdown) {
      await command.shutdown(this);
    }
    delete require.cache[require.resolve(`${commandPath}${path.sep}${commandName}.js`)];
    return false;
  }

  /* SETTINGS FUNCTIONS
  These functions are used by any and all location in the bot that wants to either
  read the current *complete* guild settings (default + overrides, merged) or that
  wants to change settings for a specific guild.
  */

  // getSettings merges the client defaults with the guild settings. guild settings in
  // enmap should only have *unique* overrides that are different from defaults.
  getSettings(guild) {
    const defaults = client.config.defaultSettings || {};
    const guildData = guild ? client.settings.get(guild.id) || {} : {};
    const returnObject = {};
    Object.keys(defaults).forEach((key) => {
      returnObject[key] = guildData[key] ? guildData[key] : defaults[key];
    });
    return returnObject;
  }

  // writeSettings overrides, or adds, any configuration item that is different
  // than the defaults. This ensures less storage wasted and to detect overrides.
  writeSettings(id, newSettings) {
    const defaults = this.settings.get("default");
    let settings = this.settings.get(id);
    if (typeof settings != "object") settings = {};
    for (const key in newSettings) {
      if (defaults[key] !== newSettings[key]) {
        settings[key] = newSettings[key];
      } else {
        delete settings[key];
      }
    }
    this.settings.set(id, settings);
  }

  /*
  MESSAGE CLEAN FUNCTION

  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  async clean(text) {
    if (text && text.constructor.name == "Promise")
      text = await text;
    if (typeof evaled !== "string")
      text = require("util").inspect(text, {depth: 0});

    text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(this.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");

    return text;
  }

  /*
  SINGLE-LINE AWAITMESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  USAGE

  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply(`Oh, I really love ${response} too!`);
  */
  async awaitReply(msg, question, limit = 60000) {
    const filter = m => m.author.id == msg.author.id;
    await msg.channel.send(question);
    try {
      const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ["time"] });
      return collected.first().content;
    } catch (e) {
      return false;
    }
  };
}

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`,
// or `bot.something`, this is what we're refering to. Your client.
const client = new QdssBot(
  { intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MEMBERS,
	  //Intents.FLAGS.GUILD_BANS,
	  //Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
	  //Intents.FLAGS.GUILD_INTEGRATIONS,
	  //Intents.FLAGS.GUILD_WEBHOOKS,
	  //Intents.FLAGS.GUILD_INVITES,
	  //Intents.FLAGS.GUILD_VOICE_STATES,
	  Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
	  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	  //Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
	  //Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    //Intents.FLAGS.DIRECT_MESSAGE_TYPING
  ]}
);


// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  klaw("./commands").on("data", (item) => {
    const cmdFile = path.parse(item.path);
    if (!cmdFile.ext || cmdFile.ext !== ".js") return;
    const response = client.loadCommand(cmdFile.dir, `${cmdFile.name}${cmdFile.ext}`);
    if (response) client.logger.error(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/");
  client.logger.log(`Loading a total of ${evtFiles.length} events.`, "log");
  evtFiles.forEach(file => {
    const eventName = file.split(".")[0];
    const event = new (require(`./events/${file}`))(client);
    // This line is awesome by the way. Just sayin'.
    client.on(eventName, (...args) => event.run(...args));
    delete require.cache[require.resolve(`./events/${file}`)];
  });

  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the client.
  client.login(client.config.token);

  // End top-level async/await function.
};

init();

client.on("disconnect", () => client.logger.warn("Bot is disconnecting..."))
  .on("reconnect", () => client.logger.log("Bot reconnecting..."))
  .on("error", e => client.logger.error(e))
  .on("warn", info => client.logger.warn(info));


/* MISCELLANEOUS NON-CRITICAL FUNCTIONS */

// EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
// later, this conflicts with native code. Also, if some other lib you use does
// this, a conflict also occurs. KNOWING THIS however, the following 2 methods
// are, we feel, very useful in code. 

// <String>.toPropercase() returns a proper-cased string such as: 
// "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
String.prototype.toProperCase = function() {
  return this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
// <Array>.random() returns a single random element from an array
// [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
};

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  console.error("Uncaught Exception: ", errorMsg);
  // Always best practice to let the code crash on uncaught exceptions. 
  // Because you should be catching them anyway.
  process.exit(1);
});

process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: ", err);
});



// ======== QDSS-Bot =========

// Scheduled query for updating the users database
const cron = require("node-cron");
cron.schedule("0 1,7,13,19 * * *", function() {
	
	const db = client.database.open();
  db.allAsync("SELECT * FROM Utenti").then( async (users) => 
	{
	  return new Promise( async (resolve, reject) =>
	  {
      if (!users || users.length == 0)
      {
        resolve();
      }
      else 
      {
        for (let i = 0; i < users.length; i++)
        {
          const id = users[i].userId;
          const tag = users[i].username;

          const user = await client.users.fetch(users[i].userId, true)
            .catch( async (err) => 
            {
              // Remove user from the database
              client.logger.log(`User ${id} does not exist anymore and will be removed (${err})`);
              await db.removeUser(id);
            });
          
          if (!user) continue;
          
          const guildMember = await client.guilds.cache.first().members.fetch(user, true)
            .catch( (err) => client.logger.warn(`Id ${id} doesn't resolve to any GuildMember (${err})`));

          if (guildMember && guildMember.user.tag !== tag)
          {
            // Update user nickname
            client.logger.log(`Renaming [${users[i].username}] to [${guildMember.user.tag}]`);
            await db.runAsync("UPDATE Utenti SET username = ? WHERE userId = ?", [guildMember.user.tag, id])
              .catch( (err) => reject(err) );
          }
        }
        
        resolve();
      }
    })
  })
  .catch( (err) => client.logger.error("Users database update failed with error: " + err) )
	.then( () => client.logger.log("Users database update complete") )
  .finally( () => db.close() );
},
{
  scheduled: true,
  timezone: "Europe/Rome"
});


// Scheduled action to create text channels dedicated to the most popular games
const QDSS_BOT_ROLE_ID = '552215756335611914';
const STAFF_ROLE_ID = '334778240847708160';
const CATEGORY_CHANNEL_ID = '592752263861108746';
const CHANNEL_CREATION_THRESHOLD = 8;
const CHANNEL_ELIMINATION_THRESHOLD = 4;
cron.schedule("0 * * * *", function() 
{
  const db = client.database.open();
  db.allAsync("SELECT G.nomeCompleto, G.ruolo, COUNT(*) AS dimensione FROM Registrazioni R, Giochi G " +
    "WHERE G.nome = R.game GROUP BY G.nomeCompleto").then( async (liste) => 
  {
    return new Promise( async (resolve, reject) =>
    {
      if (!liste || liste.length == 0)
      {
        resolve();
      }
      else 
      {
        const guild = client.guilds.cache.first();
        const channels = guild.channels.cache;

        for (let i = 0; i < liste.length; i++)
        {
          const channelName = tools.sanitizeTextChannelName(liste[i].nomeCompleto);
          let channel = channels.find((val) => val.name === channelName);

          let role = await guild.roles.fetch(liste[i].ruolo);

          // If an underpopulated channel exists, it must be eliminated
          if (liste[i].dimensione < CHANNEL_ELIMINATION_THRESHOLD && channel)
          {
              channel.delete()
                .catch( (err) => client.logger.error(`Errore nell'eliminazione della stanza ${channelName}: ${err}`) );
          }
          // If a decently-populated list does not have a dedicated channel, it must be created
          else if (liste[i].dimensione >= CHANNEL_CREATION_THRESHOLD && !channel)
          {
            guild.channels.create(channelName, {
              type: 'text',
              parent: CATEGORY_CHANNEL_ID,
              permissionOverwrites: [
              {
                  id: guild.id,               // Normal users are not allowed to view the channel
                  deny: ['VIEW_CHANNEL']
              },

              {
                  id: QDSS_BOT_ROLE_ID,
                  allow: ['VIEW_CHANNEL', 'ADMINISTRATOR']      // The bot can view and administrate the channel
              },

              {
                  id: STAFF_ROLE_ID,
                  allow: ['VIEW_CHANNEL', 'SEND_MESSAGES',      // The staff can moderate the channel
                    'MANAGE_MESSAGES', 'ADD_REACTIONS', 
                    'EMBED_LINKS', 'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS', 'CHANGE_NICKNAME',
                    'MENTION_EVERYONE', 'MANAGE_NICKNAMES', 'KICK_MEMBERS', 'BAN_MEMBERS'],
                  deny: ['CREATE_INSTANT_INVITE']
              },

              {
                  id: role.id,
                  allow: ['VIEW_CHANNEL', 'SEND_MESSAGES',      // Permissions only for members having the role for which the channel was created
                    'ADD_REACTIONS', 'EMBED_LINKS',
                    'ATTACH_FILES', 'USE_EXTERNAL_EMOJIS', 'CHANGE_NICKNAME'],
                  deny: ['MENTION_EVERYONE', 'CREATE_INSTANT_INVITE']
              }]
            })
            .catch( (err) => client.logger.error(`Errore nella creazione della stanza ${channelName}: ${err}`) )
            .then( (chan) => 
            {
                chan.send(`${role} Questa stanza è stata creata automaticamente per mettere a disposizione un luogo in cui discutere` + 
                  ` liberamente di ${liste[i].nomeCompleto}, organizzare partite e pubblicare annunci comunicando direttamente con gli` + 
                  ` altri utenti iscritti alla lista del gioco. Rimane sempre valido il regolamento generale del server, per cui non` + 
                  ` esitate a contattare Admin o Staff per ogni evenienza o necessità.`);
            });
          }
        }
        resolve();
      }
    })
  })
  .catch( (err) => client.logger.error("TextChannels update failed with error: " + err) )
  .then( () => client.logger.log("TextChannels update complete") )
  .finally( () => db.close() );
},
{
  scheduled: true,
  timezone: "Europe/Rome"
});


// Feed
const cheerio = require('cheerio')
const Watcher = require('feed-watcher'),
feed      = 'https://qdss.it/feed',
interval  = 3600 // seconds
const TurndownService = require('turndown');
const watcher = new Watcher(feed, interval);

const FEED_CHANNEL_ID = '344523238719619083';

// Check for new entries every n seconds.
watcher.on('new entries', function (entries) {
  entries.forEach( async function (entry) {
    console.log(entry['rss:title']['#'])

    const title = entry.title;
    const author = entry.author;
    const link = entry.link;
    const logo = 'https://scontent.fbri1-1.fna.fbcdn.net/v/t1.0-9/16640956_558100834395740_3216339822482768615_n.png?_nc_cat=110&_nc_sid=85a577&_nc_ohc=1wXkuKZo7dgAX-HoyGb&_nc_ht=scontent.fbri1-1.fna&oh=92909a49c2f09b260eb9b3345994e334&oe=5EC35511';
    const date = entry.date;
    const description = entry['rss:description']['#'];
    const $ = cheerio.load(description);
    
    const img = $('img').attr('src');
    $('post-thumbnail').remove();

    const htmldescription = $.html();

    const turndownService = new TurndownService();
    turndownService.addRule('url', 
    {
      filter: function (node, options) {
        return (
          options.linkStyle === 'inlined' &&
          node.nodeName === 'A' &&
          node.getAttribute('href')
        );
      },
      replacement: function (content, node) {
        const href = node.getAttribute('href');
        const title = node.title ? ' "' + node.title + '"' : '';
        return '[' + content + '](' + href + title + ')';
      }
    });
    const descMarkdown = turndownService.turndown(htmldescription);
    
    const article = new MessageEmbed()
      .setTitle(title)
      .setAuthor(author)
      .setImage(img)
      .setThumbnail(logo)
      .setURL(link)
      .setDescription(descMarkdown)
      .setTimestamp(date);

      client.channels.fetch(FEED_CHANNEL_ID)
        .catch((err) => client.logger.error(err))
        .then(channel => channel.send(article));
  })
})

// Start watching the feed.
watcher
.start()
.then((entries) => {})
.catch((error) => client.logger.error(error));

// Stop watching the feed.
//watcher.stop();
