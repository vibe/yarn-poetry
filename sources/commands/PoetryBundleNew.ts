import { CommandContext } from "@yarnpkg/core";
import { Command } from "clipanion";
import isPyProject from "../utils/is-pyproject";
import { PoetryBundleTargets } from "../utils/poetry-bundle-targets";
import PoetryProject from "../utils/poetry-project";

export default class PoetryNewCommand extends Command<CommandContext> {
    @Command.String({required: true})
    public name!: string;

    @Command.Path(`poetry`, `new`)
    async execute() {
      await PoetryProject.generate(this.context.cwd, this.name)
    }
  }