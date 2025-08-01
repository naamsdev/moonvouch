# Bot Vouch Discord

Un bot Discord qui génère des embeds de vouch similaires à l'image fournie.

## Fonctionnalités

- Commande slash `/vouch` avec les paramètres :
  - `user` : L'utilisateur pour qui créer le vouch
  - `message` : Message du vouch
  - `stars` : Note en étoiles (1-5)
- Embed personnalisé avec :
  - Titre "New vouch created!"
  - Étoiles dorées selon la note
  - Score calculé (étoiles × 2/10)
  - Numéro de vouch automatique
  - Mentions des utilisateurs
  - Date et heure en français
  - Thumbnail avec l'avatar de l'utilisateur
  - Couleur violette

## Installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd naams_vouch_bot
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration**
   - Copier `env.example` vers `.env`
   - Remplir les variables d'environnement :
     ```
     DISCORD_TOKEN=votre_token_bot
     VOUCH_CHANNEL_ID=id_du_salon_vouch
     GUILD_ID=id_du_serveur
     ```

4. **Créer un bot Discord**
   - Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créer une nouvelle application
   - Aller dans "Bot" et copier le token
   - Activer les "Message Content Intent"
   - Inviter le bot sur votre serveur avec les permissions :
     - Send Messages
     - Use Slash Commands
     - Embed Links

## Utilisation

1. **Démarrer le bot**
   ```bash
   npm start
   ```

2. **Utiliser la commande**
   ```
   /vouch user:@utilisateur message:Excellent service! stars:5
   ```

## Structure du projet

```
naams_vouch_bot/
├── index.js          # Code principal du bot
├── package.json      # Dépendances
├── env.example       # Exemple de configuration
└── README.md         # Ce fichier
```

## Permissions requises

Le bot a besoin des permissions suivantes :
- `Send Messages` : Pour envoyer les embeds
- `Use Slash Commands` : Pour utiliser les commandes slash
- `Embed Links` : Pour créer des embeds
- `View Channels` : Pour voir le salon de vouch

## Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur le repository. 