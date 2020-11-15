
import { promisify } from 'util'
import * as child_process from 'child_process'
import {CommandContext, Plugin} from '@yarnpkg/core';
import {Command} from 'clipanion';
import isPyProject from './utils/is-pyproject'
import PoetryProject from './utils/poetry-project'

const exec = promisify(child_process.exec) as any

enum PoetryBundleTargets {
  poetry = 'poetry',
  aws = 'aws',
}

class PoetryBundleCommand extends Command<CommandContext> {
  @Command.Array(`--targets`)
  public targets?: string[] = [PoetryBundleTargets.poetry, PoetryBundleTargets.aws];


  @Command.Path(`poetry`, `bundle`)
  async execute() {
    const pyproject  = await isPyProject(this.context.cwd)
    if(!pyproject) {
      this.context.stdout.write(`Skipping ${this.context.cwd} - pyproject.toml was not found..\n`);
      return;
    } 
    
    const poetryProject = await new PoetryProject(this.context.cwd)
    await poetryProject.bundle(this.targets)
  }
}

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      // console.log(`Yarn Poetry 🥱`);
    },
  },
  commands: [
    PoetryBundleCommand,
  ],
};

export default plugin;
