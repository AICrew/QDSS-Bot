module.exports = {
  apps : [{
    name: 'QDSS-Bot',
    script: 'index.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
	dependencies: {
		"better-sqlite-pool": "^0.1.2",
		"body-parser": "^1.18.3",
		"chalk": "^2.4.1",
		"cheerio": "^0.22.0",
		"discord.js": "^11.4.2",
		"ejs": "^2.6.1",
		"ejs-lint": "^0.3.0",
		"enmap": "^4.3.3",
		"enmap-sqlite": "^2.0.5",
		"express": "^4.16.4",
		"express-session": "^1.15.6",
		"forever-monitor": "^1.7.1",
		"google-auth-library": "^2.0.0",
		"googleapis": "^34.0.0",
		"helmet": "^3.14.0",
		"http": "^0.0.0",
		"inquirer": "^6.2.0",
		"klaw": "^3.0.0",
		"m": "^1.5.1",
		"marked": "^0.5.1",
		"memorystore": "^1.6.0",
		"moment": "^2.22.2",
		"moment-duration-format": "^2.2.2",
		"mongodb": "^3.1.8",
		"mongoose": "^5.3.2",
		"multer": "^1.4.1",
		"node-cron": "^2.0.3",
		"opn": "^5.4.0",
		"passport": "^0.4.0",
		"passport-discord": "^0.1.3",
		"readline-sync": "^1.4.9",
		"redis": "^2.8.0",
		"redis-server": "^1.2.2",
		"server-destroy": "^1.0.1",
		"sqlite3": "^4.0.3",
		"wpapi": "^1.1.2",
		"youtube-search": "^1.1.3"
	}	
  }]
};
