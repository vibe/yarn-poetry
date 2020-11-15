import { CommandContext } from "@yarnpkg/core";
import { Command } from "clipanion";
import isPyProject from "../utils/is-pyproject";
import { PoetryBundleTargets } from "../utils/poetry-bundle-targets";
import PoetryProject from "../utils/poetry-project";

export default class PoetryTestCommand extends Command<CommandContext> {  
    @Command.Path(`poetry`, `test`)
    async execute() {
      const pyproject  = await isPyProject(this.context.cwd)
      if(!pyproject) {
        this.context.stdout.write(`Skipping ${this.context.cwd} - pyproject.toml was not found..\n`);
        return;
      } 
      
      const poetryProject = await new PoetryProject(this.context.cwd)
      await poetryProject.test()
    }
  }