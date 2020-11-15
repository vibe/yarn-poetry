
import { promisify } from 'util'
import * as child_process from 'child_process'
import {CommandContext, Plugin} from '@yarnpkg/core';
import {Command} from 'clipanion';
import isPyProject from './utils/is-pyproject'
import PoetryProject from './utils/poetry-project'

const exec = promisify(child_process.exec) as any

class PoetryCommand extends Command<CommandContext> {
  @Command.Path(`poetry`, `bundle`, `aws`)
  async execute() {
    const pyproject  = await isPyProject(this.context.cwd)
    if(!pyproject) {
      this.context.stdout.write(`Skipping ${this.context.cwd} - pyproject.toml was not found..\n`);
      return;
    } 
    
    const poetryProject = await new PoetryProject(this.context.cwd)
    await poetryProject.bundle()

    
  }
}

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      // console.log(`Yarn Poetry 🥱`);
    },
  },
  commands: [
    PoetryCommand,
  ],
};

export default plugin;
