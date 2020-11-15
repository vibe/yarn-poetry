import { promisify } from 'util'
import * as child_process from 'child_process'
import {CommandContext, Plugin} from '@yarnpkg/core';
import PoetryBundleCommand from './commands/PoetryBundleCommand';
import PoetryNewCommand from './commands/PoetryNewCommand';
import PoetryTestCommand from './commands/PoetryTestCommand';

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      // console.log(`Yarn Poetry 🥱`);
    },
  },
  commands: [
    PoetryBundleCommand,
    PoetryNewCommand,
    PoetryTestCommand
  ],
};

export default plugin;
