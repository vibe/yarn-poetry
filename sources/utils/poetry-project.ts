import * as toml from 'toml'
import { promisify } from 'util'
import { parse } from 'path';
import { exec as ogExec, spawn } from 'child_process'
import { readFile, writeFile, copy } from 'fs-extra'
import { createPrinter } from 'typescript';

import bundlePoetry from './poetry-bundle'
import bundleAws from './poetry-bundle-aws'

const exec = promisify(ogExec)

export default class PoetryProject {
    path: string;
    filePath: string;
    rawTOML: string;
    toml: any;

    projectName: string;
    projectModuleName: string;

    bundlers = {
        poetry: bundlePoetry,
        aws: bundleAws
    }

    constructor(projectPath) {
        //@ts-ignore
        return (async () => {
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

    async bundle(targets = []) {
        targets.forEach(target => {
            const targetBundler = this.bundlers[target]
            if (!targetBundler) {
                throw Error(`This bundler doesn't exist.`)
            }
            targetBundler(this)
        })
    }

    static isPoetryProject(toml) {
        return !!toml?.tool?.poetry?.name;
    }
}