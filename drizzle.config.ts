import { defineConfig } from 'drizzle-kit';
import { globSync } from 'glob';
import path from 'path';

const schema = ['./src/db/schema'];

const slicesPath = './src/store/features';
globSync(path.resolve(__dirname, slicesPath + '/*/db/schema')).map((file) => {
	schema.push(file);
});

export default defineConfig({
	dialect: 'sqlite',
	driver: 'expo',
	schema,
	out: './drizzle',
});
