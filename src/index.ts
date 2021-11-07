import NeonJS from '@neonjs/framework';
import config from 'config';

const client = new NeonJS.NeonClient(config.get('ownerId'), {
	intents: [
		'GUILDS',
	],
});

client.on('ready', () => {
	client.logger.info('UwU');
});

client.login(config.get('token'));
