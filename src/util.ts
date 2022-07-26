import * as pathlib from 'path'

export function movePath(from: string, to: string, path: string) {
	return pathlib.resolve(to, pathlib.relative(from, path))
}
