import { promisify } from 'util'

const exec = promisify(require('child_process').exec);
const access = promisify(require('fs').access);

export default async (path) => {
    const pyproject = `${path}/pyproject.toml`
    try {
      await access(pyproject)
      return pyproject;
    } catch {
      return null;
    }
  }