import { promisify } from 'util'
import * as child_process from 'child_process'
import {CommandContext, Plugin} from '@yarnpkg/core';
import PoetryBundleCommand from './commands/PoetryBundleCommand';

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
