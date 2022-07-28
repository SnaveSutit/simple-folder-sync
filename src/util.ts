import * as pathlib from 'path'

export function movePath(from: string, to: string, path: string) {
	return pathlib.resolve(to, pathlib.relative(from, path))
}

export function resolveToAbsolutePath(path: string) {
	return path.replace(/%([^%]+)%/g, function (_, key) {
		if (!process.env[key]) {
			throw new Error('Environment variable ' + key + ' does not exist.')
		}
		return process.env[key]!
	})
}
