import { promisify } from 'util'
import * as child_process from 'child_process'
import {CommandContext, Plugin} from '@yarnpkg/core';
import PoetryBundleCommand from './commands/PoetryBundleCommand';
import PoetryNewCommand from './commands/PoetryBundleNew';

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      // console.log(`Yarn Poetry 🥱`);
    },
  },
  commands: [
    PoetryBundleCommand,
    PoetryNewCommand
  ],
};

export default plugin;
