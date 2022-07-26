const fs = require('fs')
const esbuild = require('esbuild')
const PACKAGE = require('../package.json')

let infoPlugin = {
	name: 'infoPlugin',
	/**
	 *
	 * @param {esbuild.PluginBuild} build
	 */
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('\u{1F528} Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			let end = Date.now()
			const diff = end - start
			console.log(
				`\u{2705} Build completed in ${diff}ms with ${result.warnings.length} warnings and ${result.errors.length} errors.`
			)
		})

		build.onLoad(
			{
				filter: /\.[tj]sx?$/,
			},
			result => {
				const code = fs.readFileSync(result.path, 'utf-8')
				return {
					contents: 'const devlog = console.log;\n' + code,
					loader: 'ts',
				}
			}
		)
	},
}

function buildDev() {
	esbuild.transformSync('function devlog(message) {console.log(message)}')
	esbuild.build({
		entryPoints: ['./src/index.ts'],
		outfile: `./dist/${PACKAGE.name}.js`,
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: true,
		plugins: [infoPlugin],
		watch: true,
		format: 'iife',
	})
}

function buildProd() {
	esbuild.transformSync('function devlog(message) {}')
	esbuild.build({
		entryPoints: ['./src/index.ts'],
		outfile: `./dist/${PACKAGE.name}.js`,
		bundle: true,
		minify: true,
		platform: 'node',
		sourcemap: false,
		plugins: [infoPlugin],
		drop: ['debugger'],
		format: 'iife',
	})
}

function main() {
	if (process.argv.includes('--mode=dev')) {
		buildDev()
		return
	}
	buildProd()
}

main()
