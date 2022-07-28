import { FSWatcher, watch } from 'chokidar'
import * as fs from 'fs'
import * as pathlib from 'path'
import * as YML from 'js-yaml'
import { movePath, resolveToAbsolutePath } from './util'

interface IConfig {
	sync_paths: { [index: string]: string }
	ignored?: string[]
}
let config: IConfig
let sync_paths: { [index: string]: string } = {}
let watchers: FSWatcher[] = []

function updateConfig() {
	try {
		config = YML.load(fs.readFileSync('sync-config.yml', 'utf8')) as IConfig
	} catch (e: any) {
		console.log('Error reading config file:')
		console.log(e.message)
	}
	for (const [_in, _out] of Object.entries(config.sync_paths)) {
		if (_out) sync_paths[resolveToAbsolutePath(_in)] = resolveToAbsolutePath(_out)
		else console.log(`Error: Path '${_in}' has no target path.`)
	}
}

function copyOver(in_path: string, out_path: string, stats?: fs.Stats) {
	console.log(`Synced '${out_path}'`)
	const par = pathlib.parse(out_path)
	if (!fs.existsSync(par.dir)) fs.mkdirSync(par.dir, { recursive: true })
	fs.copyFileSync(in_path, out_path)
}

async function updateWatchers() {
	for (const watcher of watchers) {
		await watcher.close()
	}
	for (const [_in, _out] of Object.entries(sync_paths)) {
		watchers.push(
			watch(_in, {
				ignored: new RegExp(
					'((^|[/\\\\])\\..)' + (config.ignored?.length ? `|(^|[/\\\\])(${config.ignored!.join('|')})` : '')
				),
				persistent: true,
			})
				.on('add', (in_path, stats) => {
					const out_path = movePath(_in, _out, in_path)
					copyOver(in_path, out_path, stats)
				})
				.on('change', (in_path, stats) => {
					const out_path = movePath(_in, _out, in_path)
					copyOver(in_path, out_path, stats)
				})
				.on('unlink', path => {
					console.log(`Deletion of '${path}' synced.`)
					const out_path = movePath(_in, _out, path)
					const par = pathlib.parse(out_path)
					fs.rmSync(out_path)
					fs.readdirSync(par.dir).length || fs.rmdirSync(par.dir)
				})
		)
	}
}

async function main() {
	updateConfig()
	await updateWatchers()

	const configWatcher = watch('./sync-config.yml', {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
	}).on('change', async (path, stats) => {
		if (pathlib.parse(path).base === 'sync-config.yml') {
			console.log(`Config file changed. Reloading config...`)
			updateConfig()
			await updateWatchers()
			console.log(`Config reloaded.`)
		}
	})

	await updateWatchers()
}

main()
