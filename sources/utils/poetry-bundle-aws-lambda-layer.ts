import { execUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { exec as ogExec, spawn } from 'child_process'
import { readFile, writeFile, copy, pathExists, ensureDir } from 'fs-extra'
import { promisify } from 'util'
import PoetryProject from './poetry-project'

const exec = promisify(ogExec)

export default async (project: PoetryProject) => {
    //copy the source into dist
    await ensureDir(`${project.path}/dist/layer/python`)
    await copy(`${project.path}/${project.projectModuleName}`, `${project.path}/dist/layer/python`)
    var { stderr, stdout } = await exec(`poetry export -f requirements.txt > ${project.path}/dist/layer/python/requirements.txt --without-hashes`, { cwd: project.path })

    // poetry currently generates invalid local references, I patch these with some regex. When project is fixed upstream, we can remove project block.
    let requirements = await readFile(`${project.path}/dist/layer/python/requirements.txt`, { encoding: 'utf-8' })
    requirements = requirements.replace(/@ \//g, '@ file:///')
    await writeFile(`${project.path}/dist/layer/python/requirements.txt`, requirements, 'utf8')

    if (stderr) {
        console.error(stderr)
        throw Error(`Failed to export requirements file: ${stderr}`)
    }

    const hasEnvPackages = await pathExists(`${project.path}/.venv/lib/python3.8/site-packages/`)

    if(hasEnvPackages) {
        console.debug('Virtual Environment exists with packages')
        await copy(`${project.path}/.venv/lib/python3.8/site-packages/`, `${project.path}/dist/layer/python/`)
        return 0
    } else {
    //use poetry to pip install in dist folder
    const {NODE_OPTIONS} = process.env;
    const {code} = await execUtils.pipevp('poetry', ['run', 'pip', 'install', '-r', 'requirements.txt', '-t', '.',], {
        cwd: npath.toPortablePath(`${project.path}/dist/layer/python`),
        stderr: project.context.stderr,
        stdin: project.context.stdin,
        stdout: project.context.stdout,
        env: {...process.env, NODE_OPTIONS},
      });
  
      return code
    }
}