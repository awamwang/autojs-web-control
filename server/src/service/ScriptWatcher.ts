import * as fs from 'fs';
import * as path from 'path';
import getLogger from '@/utils/log4js';
import * as chokidar from 'chokidar';

import { WebSocketManager } from './WebSocketManager';
import ScriptModel from '@/model/script.model';

const logger = getLogger('ScriptWatcher');
const SCRIPT_DIR = process.env.SERVER_SCRIPT_DIR || './scripts';
const ScriptPollingInterval = parseInt(process.env.SERVER_SCRIPT_POLLING_INTERVAL) || 10 * 1000;

export interface ScriptWatchEvent {
  type: 'add' | 'change'
  path: string;
  script: string;
  name: string;
  args: string;
}
const scriptListeners: Array<(event: ScriptWatchEvent) => void> = [];

export default class ScriptWatcher {
  private static instance: ScriptWatcher;
  private static watcher: chokidar.FSWatcher;

  static getInstance() {
    if (!ScriptWatcher.instance) {
      ScriptWatcher.instance = new ScriptWatcher();
    }
    return ScriptWatcher.instance;
  }

  public static getWatchEvent(p: string, type: ScriptWatchEvent['type'] = 'change'): ScriptWatchEvent {
    return {
      type,
      path: p,
      script: fs.readFileSync(p, 'utf-8'),
      name: path.basename(p),
      args: '',
    };
  }

  public static addScriptListener(listener: (event: ScriptWatchEvent) => void) {
    scriptListeners.push(listener);
  }

  public static removeScriptListener(listener: (event: ScriptWatchEvent) => void) {
    scriptListeners.splice(scriptListeners.indexOf(listener), 1);
  }

  public static async autoSave(event: ScriptWatchEvent) {
    const name = (event.name || '').split('.')[0];
    const script = event.script;

    const scriptData = {
      script_name: name,
      script,
      script_args: event.args,
    };
    logger.debug(`autoSave event -> ${event.type} -> ${name}`);

    await ScriptModel.upsertBy('script_name', scriptData);
  }

  private static watchDir(dir = SCRIPT_DIR) {
    const dirPath = path.resolve(dir);
    const scriptsGlob = `${dirPath}/**/*.js`

    if (!fs.existsSync(dirPath)) {
      // throw new Error(`ScriptWatcher script dir ${dir} not exists!`);
      logger.info(`script dir '${dirPath}' not exists, create it!`);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    this.watcher = chokidar.watch(scriptsGlob, {
      ignoreInitial: false,
      // useFsEvents: true,
      usePolling: true,
      interval: ScriptPollingInterval,
      binaryInterval: ScriptPollingInterval,
      // alwaysStat: true,
      awaitWriteFinish : true,
      ignorePermissionErrors: true
    });

    this.watcher.on('add', (p) => {
      logger.debug(`add ${p}`);
      scriptListeners.forEach((listener) => {
        listener(this.getWatchEvent(p, 'add'));
      });
    });
    this.watcher.on('change', (p) => {
      logger.debug(`change ${p}`);
      scriptListeners.forEach((listener) => {
        listener(this.getWatchEvent(p, 'change'));
      })
    })

    logger.info(`start watch -> '${scriptsGlob}'`);
  }

  public static init() {
    if (!ScriptWatcher.instance) {
      ScriptWatcher.instance = new ScriptWatcher();
    }

    this.watchDir();
    this.addScriptListener(this.autoSave);
  }
}
