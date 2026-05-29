import { commandExec } from "../utils/exec";
import { listDir } from "../utils/fs/list-dir";

enum Sounds {
  Success,
  Fail
}

type OsSoundConfiguration = {
  soundPath: string;
  soundMap: Record<Sounds, string>;
  playCommand: (name: string, time: number) => string;
}

type OsEnv = Record<string, OsSoundConfiguration>;

const env: OsEnv = {
  darwin: {
    soundPath: '/System/Library/Sounds',
    soundMap: {
      [Sounds.Success]: 'Funk.aiff',
      [Sounds.Fail]: 'Sosumi.aiff',
    },
    playCommand: (name, time) => `afplay /System/Library/Sounds/${name} -t ${time}`
  },
}

const sounds: string[] = [];

export async function playSound(
  name: Sounds,
  noecho: boolean = false,
  time: number = 999,
) {
  try {
    const {soundPath, playCommand, soundMap} = env[process.platform];
    if (!sounds.length) {
      sounds.push(...await listDir(soundPath));
    }
    const sound = soundMap[name];

    if (sounds.includes(sound)) {
      const cmd = playCommand(sound, time);
      await commandExec(cmd, {
        noecho,
      });
    } else {
      console.log("no sound", name);
    }
  } catch (e) {
    console.error(e);
  }
}

export async function successSound() {
  playSound(Sounds.Success, true, 0.25);
}

export async function failSound() {
  playSound(Sounds.Fail, true, 0.25);
}
