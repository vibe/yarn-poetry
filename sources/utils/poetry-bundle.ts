import { exec as ogExec, spawn } from 'child_process'
import { promisify } from 'util'

const exec = promisify(ogExec)

export default async project => {
    var { stderr, stdout } = await exec('poetry build', { cwd: project.path })
    if (stderr) {
        console.error(stderr)
        throw Error(`Failed to run poetry build: ${stderr}`)
    }
}