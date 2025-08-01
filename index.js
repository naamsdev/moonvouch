const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration
const config = {
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    vouchChannelId: process.env.VOUCH_CHANNEL_ID
};

// Commandes slash
const commands = [
    new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Créer un nouveau vouch - Create a new vouch')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur pour qui créer le vouch - User to vouch')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message du vouch - Message voucher')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('stars')
                .setDescription('Note en étoiles (1-5) - Rating (1-5)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)),
    new SlashCommandBuilder()
        .setName('vouchall')
        .setDescription('Afficher tous les vouch - Show all vouches'),
    new SlashCommandBuilder()
        .setName('voucher')
        .setDescription('Gérer les utilisateurs autorisés à recevoir des vouch')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter un utilisateur à la liste des vouch autorisés')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à autoriser')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retirer un utilisateur de la liste des vouch autorisés')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à retirer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Afficher la liste des utilisateurs autorisés'))
];

// Fonction pour générer les étoiles
function generateStars(count) {
    const fullStar = '⭐';
    const emptyStar = '☆';
    return fullStar.repeat(count) + emptyStar.repeat(5 - count);
}

// Fonction pour calculer le score
function calculateScore(stars) {
    return `${stars}/5`;
}

// Système de stockage des vouch (en mémoire pour cet exemple)
let vouchCounter = 1;
let vouchHistory = new Map(); // Map pour stocker les vouch par utilisateur
let authorizedUsers = new Set(); // Set pour stocker les utilisateurs autorisés à recevoir des vouch

function getNextVouchNumber() {
    return vouchCounter++;
}

// Fonction pour ajouter un vouch à l'historique
function addVouchToHistory(userId, authorId, stars) {
    if (!vouchHistory.has(userId)) {
        vouchHistory.set(userId, {
            totalVouches: 0,
            totalStars: 0,
            averageStars: 0,
            vouchedBy: new Set()
        });
    }
    
    const userStats = vouchHistory.get(userId);
    userStats.totalVouches++;
    userStats.totalStars += stars;
    userStats.averageStars = Math.round((userStats.totalStars / userStats.totalVouches) * 10) / 10;
    userStats.vouchedBy.add(authorId);
}

// Fonction pour obtenir les statistiques de vouch
function getVouchStats() {
    const stats = [];
    for (const [userId, userStats] of vouchHistory.entries()) {
        stats.push({
            userId: userId,
            totalVouches: userStats.totalVouches,
            averageStars: userStats.averageStars,
            totalStars: userStats.totalStars
        });
    }
    
    // Trier par nombre de vouch décroissant
    return stats.sort((a, b) => b.totalVouches - a.totalVouches);
}

// Fonction pour formater la date en français
function formatDateFrench() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const frenchDate = now.toLocaleDateString('fr-FR', options);
    return frenchDate;
}

// Fonction pour créer l'embed de vouch
function createVouchEmbed(user, message, stars, author) {
    const embed = new EmbedBuilder()
        .setTitle('New vouch created!')
        .setDescription(`${generateStars(stars)}\n\n**Message:** ${message}`)
        .setColor('#9B59B6') // Couleur violette
        .addFields(
            { name: 'Vouch:', value: calculateScore(stars), inline: false },
            { name: 'Vouch Nb:', value: getNextVouchNumber().toString(), inline: true },
            { name: 'Vouched by:', value: `<@${author.id}>`, inline: true },
            { name: 'Vouched for:', value: `<@${user.id}>`, inline: true },
            { name: 'Vouched at:', value: formatDateFrench(), inline: false }
        )
        .setFooter({ text: `Service provided by @Naams` })
        .setTimestamp();

    // Thumbnail avec l'avatar de l'utilisateur
    if (user.avatarURL()) {
        embed.setThumbnail(user.avatarURL({ format: 'png', size: 128 }));
    }

    return embed;
}

// Fonction pour créer l'embed de tous les vouch
function createVouchAllEmbed() {
    const stats = getVouchStats();
    
    if (stats.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques des Vouch')
            .setDescription('Aucun vouch n\'a encore été créé.')
            .setColor('#9B59B6')
            .setFooter({ text: `Service provided by @Naams` })
            .setTimestamp();
        return embed;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques des Vouch')
        .setDescription(`Total des vouch créés: **${stats.length}** utilisateurs`)
        .setColor('#9B59B6')
        .setFooter({ text: `Service provided by @Naams` })
        .setTimestamp();
    
    // Créer les champs pour chaque utilisateur (max 25 pour éviter les limites Discord)
    const maxFields = Math.min(stats.length, 25);
    for (let i = 0; i < maxFields; i++) {
        const stat = stats[i];
        const stars = generateStars(Math.round(stat.averageStars));
        const fieldValue = `⭐ **${stat.totalVouches}** vouch | **${stat.averageStars}/5** moyenne\n${stars}`;
        
        embed.addFields({
            name: `#${i + 1} <@${stat.userId}>`,
            value: fieldValue,
            inline: false
        });
    }
    
    return embed;
}

// Gestionnaire d'événements
client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);

        // Système de statut rotatif
        const statuses = [
            { name: 'Cheap Services', type: 3 }, // PLAYING
            { name: '.gg/moonstore', type: 3 }, // PLAYING
            { name: 'Developer : Naams', type: 3 }, // PLAYING
            { name: 'SellAuth soon', type: 3 } // PLAYING
        ];
        
        let currentStatusIndex = 0;
        
        const updateStatus = () => {
            try {
                const status = statuses[currentStatusIndex];
                client.user.setPresence({
                    activities: [{
                        name: status.name,
                        type: status.type
                    }],
                    status: 'online'
                });
                console.log(`🔄 Statut changé: "${status.name}"`);
                currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
            } catch (error) {
                console.error('❌ Erreur lors du changement de statut:', error);
            }
        };
        
        // Définir le premier statut
        updateStatus();
        
        // Changer le statut toutes les 3 minutes (180000 ms)
        setInterval(updateStatus, 180000);
        
        console.log('✅ Système de statut rotatif activé (changement toutes les 3 minutes)');
    
    
    // Enregistrer les commandes slash
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    (async () => {
        try {
            console.log('Enregistrement des commandes slash...');
            
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, config.guildId),
                { body: commands }
            );
            
            console.log('Commandes slash enregistrées avec succès!');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des commandes:', error);
        }
    })();
});

// Gestionnaire d'interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vouch') {
        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const stars = interaction.options.getInteger('stars');
        const author = interaction.user;

        try {
            // Vérifier si l'utilisateur est autorisé à recevoir des vouch
            if (!authorizedUsers.has(user.id)) {
                await interaction.reply({
                    content: `❌ ${user.username} n'est pas autorisé à recevoir des vouch. Utilisez \`/voucher add\` pour l'autoriser.`,
                    ephemeral: true
                });
                return;
            }
            
            // Ajouter le vouch à l'historique
            addVouchToHistory(user.id, author.id, stars);
            
            // Créer l'embed
            const embed = createVouchEmbed(user, message, stars, author);
            
            // Envoyer l'embed dans le salon configuré
            const channel = client.channels.cache.get(config.vouchChannelId);
            if (channel) {
                await channel.send({ embeds: [embed] });
                
                // Confirmation à l'utilisateur
                await interaction.reply({
                    content: `✅ Vouch créé avec succès pour ${user.username}!`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur: Salon de vouch non trouvé. Vérifiez la configuration.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur lors de la création du vouch:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création du vouch.',
                ephemeral: true
            });
        }
    } else if (interaction.commandName === 'vouchall') {
        try {
            // Créer l'embed de tous les vouch
            const embed = createVouchAllEmbed();
            
            // Envoyer l'embed dans le salon configuré
            const channel = client.channels.cache.get(config.vouchChannelId);
            if (channel) {
                await channel.send({ embeds: [embed] });
                
                // Confirmation à l'utilisateur
                await interaction.reply({
                    content: '✅ Statistiques des vouch envoyées!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ Erreur: Salon de vouch non trouvé. Vérifiez la configuration.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur lors de l\'affichage des vouch:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'affichage des vouch.',
                ephemeral: true
            });
        }
    } else if (interaction.commandName === 'voucher') {
        const subcommand = interaction.options.getSubcommand();
        
        // Vérifier si l'utilisateur est le propriétaire du bot (vous)
        if (interaction.user.id !== '603256188838215690') { // Remplacez par votre ID Discord
            await interaction.reply({
                content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
                ephemeral: true
            });
            return;
        }
        
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            authorizedUsers.add(user.id);
            
            await interaction.reply({
                content: `✅ ${user.username} a été ajouté à la liste des utilisateurs autorisés à recevoir des vouch.`,
                ephemeral: true
            });
            
        } else if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            authorizedUsers.delete(user.id);
            
            await interaction.reply({
                content: `✅ ${user.username} a été retiré de la liste des utilisateurs autorisés à recevoir des vouch.`,
                ephemeral: true
            });
            
        } else if (subcommand === 'list') {
            if (authorizedUsers.size === 0) {
                await interaction.reply({
                    content: '📋 Aucun utilisateur autorisé à recevoir des vouch.',
                    ephemeral: true
                });
                return;
            }
            
            const userList = Array.from(authorizedUsers).map(userId => `<@${userId}>`).join('\n');
            await interaction.reply({
                content: `📋 **Utilisateurs autorisés à recevoir des vouch:**\n${userList}`,
                ephemeral: true
            });
        }
    }
});

// Gestionnaire d'erreurs
client.on('error', error => {
    console.error('Erreur du bot Discord:', error);
});

// Connexion du bot
client.login(config.token); 