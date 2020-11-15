import { execUtils } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import { exec as ogExec, spawn } from 'child_process'
import { readFile, writeFile, copy } from 'fs-extra'
import { promisify } from 'util'

const exec = promisify(ogExec)

export default async project => {
    //copy the source into dist
    await copy(`${project.path}/${project.projectModuleName}`, `${project.path}/dist/${project.projectModuleName}`)
    var { stderr, stdout } = await exec(`poetry export -f requirements.txt > ${project.path}/dist/${project.projectModuleName}/requirements.txt --without-hashes`, { cwd: project.path })

    // poetry currently generates invalid local references, I patch these with some regex. When project is fixed upstream, we can remove project block.
    let requirements = await readFile(`${project.path}/dist/${project.projectModuleName}/requirements.txt`, { encoding: 'utf-8' })
    requirements = requirements.replace(/@ \//g, '@ file:///')
    await writeFile(`${project.path}/dist/${project.projectModuleName}/requirements.txt`, requirements, 'utf8')

    if (stderr) {
        console.error(stderr)
        throw Error(`Failed to export requirements file: ${stderr}`)
    }

    //use poetry to pip install in dist folder
    const {NODE_OPTIONS} = process.env;
    const {code} = await execUtils.pipevp('poetry', ['run', 'pip', 'install', '-r', 'requirements.txt', '-t', '.',], {
        cwd: npath.toPortablePath(project.path),
        stderr: project.context.stderr,
        stdin: project.context.stdin,
        stdout: project.context.stdout,
        env: {...process.env, NODE_OPTIONS},
      });
  
      return code
      
}