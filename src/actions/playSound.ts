import { commandExec } from "../utils/exec";
import { listDir } from "../utils/fs/list-dir";

const sounds = listDir("/System/Library/Sounds");

export async function playSound(
  name: string,
  noecho: boolean = false,
  time: number = 999,
) {
  try {
    const available = await sounds;
    if (available.includes(name)) {
      await commandExec(`afplay /System/Library/Sounds/${name} -t ${time}`, {
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
  playSound("Funk.aiff", true, 0.25);
}

export async function failSound() {
  playSound("Sosumi.aiff", true, 0.25);
}
