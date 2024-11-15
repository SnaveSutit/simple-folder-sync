import { FSWatcher, watch } from 'chokidar'
import * as fs from 'fs'
import * as pathlib from 'path'
import { debounce, movePath } from './util'
import { config, updateConfig } from './configHandler'
import chalk from 'chalk'

const termPrefix = chalk.gray('[') + chalk.yellow('simple-sync') + chalk.gray(']')

let watchers: FSWatcher[] = []

const changes = {
	added: [] as string[],
	changed: [] as string[],
	deleted: [] as string[],
}

const printChanges = debounce(() => {
	console.log(termPrefix, chalk.blue.underline('Changes synced!'))
	console.log(termPrefix, chalk.green(`+ Added ${changes.added.length} files`))
	console.log(termPrefix, chalk.yellow(`~ Changed ${changes.changed.length} files`))
	console.log(termPrefix, chalk.red(`- Deleted ${changes.deleted.length} files`))
	console.log('')

	changes.added = []
	changes.changed = []
	changes.deleted = []
})

function copyOver(in_path: string, out_path: string, stats?: fs.Stats) {
	const par = pathlib.parse(out_path)
	if (!fs.existsSync(par.dir)) fs.mkdirSync(par.dir, { recursive: true })
	fs.copyFileSync(in_path, out_path)
}

async function updateWatchers() {
	for (const watcher of watchers) {
		await watcher.close()
	}
	watchers = []
	for (const [_in, _out] of Object.entries(config.sync_paths)) {
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
					changes.added.push(out_path)
					printChanges()
				})
				.on('change', (in_path, stats) => {
					const out_path = movePath(_in, _out, in_path)
					copyOver(in_path, out_path, stats)
					changes.changed.push(out_path)
					printChanges()
				})
				.on('unlink', path => {
					const out_path = movePath(_in, _out, path)
					const par = pathlib.parse(out_path)
					fs.rmSync(out_path)
					fs.readdirSync(par.dir).length || fs.rmdirSync(par.dir)
					changes.deleted.push(out_path)
					printChanges()
				})
		)
	}
}

async function main() {
	if (!fs.existsSync('sync-config.yml')) {
		console.log('Error: No sync-config.yml file found!')
		return
	}

	watch('./sync-config.yml', {
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

	updateConfig()
	console.log(`Running initial sync...`)
	await updateWatchers()
}

main()
