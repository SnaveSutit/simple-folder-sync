import * as YML from 'js-yaml'
import * as fs from 'fs'
import { resolvePathEnvVariables } from './util'

interface IConfig {
	sync_paths: { [index: string]: string }
	ignored?: string[]
}
export let config: IConfig

export function updateConfig() {
	try {
		config = YML.load(fs.readFileSync('sync-config.yml', 'utf8')) as IConfig
	} catch (e: any) {
		console.log('Error reading config file:')
		console.log(e.message)
	}
	if (!config.sync_paths) {
		console.log('Error: No sync_paths found in config file!')
		return
	}
	for (const [_in, _out] of Object.entries(config.sync_paths)) {
		if (_out) config.sync_paths[resolvePathEnvVariables(_in)] = resolvePathEnvVariables(_out)
		else console.log(`Error: Path '${_in}' has no target path.`)
	}
}
