import * as toml from 'toml'
import { promisify } from 'util'
import { parse } from 'path';
import { exec as ogExec, spawn } from 'child_process'
import { readFile, writeFile, copy } from 'fs-extra'

import bundlePoetry from './poetry-bundle'
import bundleAws from './poetry-bundle-aws'
import bundleAwsLambdaLayer from './poetry-bundle-aws-lambda-layer'

const exec = promisify(ogExec)

import { execUtils } from '@yarnpkg/core'
import {NativePath, npath} from '@yarnpkg/fslib';
export default class PoetryProject {
    context: any;

    path: string;
    filePath: string;
    rawTOML: string;
    toml: any;

    projectName: string;
    projectModuleName: string;

    bundlers = {
        'poetry': bundlePoetry,
        'aws': bundleAws,
        'aws-lambda-layer': bundleAwsLambdaLayer
    }

    constructor(projectPath, { context } = { context: null}) {
        //@ts-ignore
        return (async () => {
            this.context = context;
            this.path = projectPath;
            this.filePath = projectPath + '/pyproject.toml'
            this.rawTOML = await readFile(this.filePath, { encoding: 'utf-8' })
            const parsedTOML = toml.parse(this.rawTOML)

            if (!PoetryProject.isPoetryProject(parsedTOML)) {
                throw Error("Failed to detect poetry project config in parsed TOML.")
            }

            this.toml = parsedTOML
            this.projectName = this.toml.tool.poetry.name
            this.projectModuleName = this.toml.tool.poetry.name.replace(/-/g, '_')

            console.log(this.projectName, this.projectModuleName)


            return this;
        })();
    }

    async build() {
        let { stderr, stdout } = await exec('poetry build', { cwd: this.path })
        if (stderr) {
            console.error(stderr)
            throw Error(`Failed to run poetry build: ${stderr}`)
        }
        console.log(stdout)
    }

    async bundle(targets = []) {
        targets.forEach(target => {
            const targetBundler = this.bundlers[target]
            if (!targetBundler) {
                throw Error(`This bundler doesn't exist.`)
            }
            targetBundler(this)
        })
    }

    async test() {
        const {NODE_OPTIONS} = process.env;
        const options = {
            cwd: npath.toPortablePath(this.path),
            stderr: this.context.stderr,
            stdin: this.context.stdin,
            stdout: this.context.stdout,
            env: {...process.env, NODE_OPTIONS},
          }
        const {code} = await execUtils.pipevp('poetry', ['run', 'pytest'], options);
      
          return code

      }
  

    static async generate(path, name, { p } = {p: true}) {
        var { stderr, stdout } = await exec(`poetry new ${name}`, { cwd: path })
        if (stderr) {
            throw new Error(stderr)
        }
        var { stderr, stdout } = await exec(`yarn init ${p ? '-p' : ''}`, { cwd: `${path}/${name}`})
        if (stderr) {
            throw new Error(stderr)
        }
        let packageJson = await readFile(`${path}/${name}/package.json`, { encoding: 'utf-8' })
        packageJson = JSON.parse(packageJson) 

        packageJson = {
            ...packageJson,
            scripts: {
                ...(packageJson['scripts'] || {}),
                'build': 'yarn poetry bundle',
                'test': 'yarn poetry test'
            }
        }
        packageJson.scripts['build'] = 'yarn poetry bundle'
        await writeFile(`${path}/${name}/package.json`, JSON.stringify(packageJson, null, 2), 'utf8')    
    }

    static isPoetryProject(toml) {
        return !!toml?.tool?.poetry?.name;
    }
}