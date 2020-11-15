import * as toml from 'toml'
import { promisify } from 'util'
import { parse } from 'path';
import { exec as ogExec, spawn  } from 'child_process'
import {readFile, writeFile, copy } from 'fs-extra'
import { createPrinter } from 'typescript';

const exec = promisify(ogExec)

export default class PoetryProject {
    path: string;
    filePath: string;
    rawTOML: string;
    toml: any;

    projectName: string;
    projectModuleName: string;

    constructor(projectPath) {
        //@ts-ignore
        return (async () => {
            this.path = projectPath;
            this.filePath = projectPath + '/pyproject.toml'
            this.rawTOML = await readFile(this.filePath, { encoding: 'utf-8'})
            const parsedTOML = toml.parse(this.rawTOML)
            
            if(!PoetryProject.isPoetryProject(parsedTOML)) {
                throw Error("Failed to detect poetry project config in parsed TOML.")
            }

            this.toml = parsedTOML
            this.projectName = this.toml.tool.poetry.name
            this.projectModuleName = this.toml.tool.poetry.name.replace(/-/g, '_')

            console.log(this.projectName, this.projectModuleName)


            return this;
        })();            
    }

    async bundle() {
       //run regulary poetry build
       var { stderr, stdout } = await exec('poetry build', { cwd: this.path })
       if (stderr) {
           console.error(stderr)
           throw Error(`Failed to run poetry build: ${stderr}`)
       }
       //copy the source into dist
       await copy(`${this.path}/${this.projectModuleName}`, `${this.path}/dist/${this.projectModuleName}`)
       var { stderr, stdout } = await exec(`poetry export -f requirements.txt > ${this.path}/dist/${this.projectModuleName}/requirements.txt --without-hashes`, { cwd: this.path })
       
       // poetry currently generates invalid local references, I patch these with some regex. When this is fixed upstream, we can remove this block.
       let requirements = await readFile(`${this.path}/dist/${this.projectModuleName}/requirements.txt`, { encoding: 'utf-8'})
       requirements = requirements.replace(/@ \//g, '@ file:///')
       await writeFile(`${this.path}/dist/${this.projectModuleName}/requirements.txt`, requirements, 'utf8')

       if (stderr) {
        console.error(stderr)
        throw Error(`Failed to export requirements file: ${stderr}`)
    }

       //use poetry to pip install in dist folder
       var { stderr, stdout } = await exec(`poetry run pip install -r requirements.txt -t . --upgrade`, { cwd: `${this.path}/dist/${this.projectModuleName}` })


       if (stderr) {
        console.error(stderr)
        throw Error(`Failed to run pip install using poetry: ${stderr}`)
    }
    }

    static isPoetryProject(toml) {
        return !!toml?.tool?.poetry?.name;
    }
}