import * as pathlib from 'path'

export function movePath(from: string, to: string, path: string) {
	return pathlib.resolve(to, pathlib.relative(from, path))
}

export function resolvePathEnvVariables(path: string) {
	return path.replace(/%([^%]+)%/g, function (_, key) {
		if (!process.env[key]) {
			throw new Error('Environment variable ' + key + ' does not exist.')
		}
		return process.env[key]!
	})
}

export function debounce(callback: () => void, delay = 250) {
	let timeout: NodeJS.Timeout
	return () => {
		clearTimeout(timeout)
		timeout = setTimeout(callback, delay)
	}
}
