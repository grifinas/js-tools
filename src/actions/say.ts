import { commandExec } from "../utils/exec";

/**
  [[ slnc 5000 ]] : silence for 5s.
  [[volm 0.9]] changes the volume to the indicated level.
  [[volm +0.1]] increases the volume by the indicated level.
  [[rate 150]] changes the speed
  [[pbas 50]] changes the pitch.
  [[ rset ]] resets all these parameters to default
  ‘word’ :quotes also put the emphasis on the word.

  E.g
  [[ slnc 5000 ]]
  [[rate 150]][[volm 0.9]]
  I am going to present studies about how we can [[rate 130]] build a ‘curious’ robot learner for ‘interactive goal-babbling’ [[rate 150]] by designing a system [[rate 130]]for [[volm 1.1]]strategically[[volm 0.9]] choosing, ‘what’, ‘how’, ‘when’, and from ‘whom’ to learn[[rate 150]]. In other words, the system [[volm 1]]chooses[[volm 0.9]] [[rate 140]]the ‘content’, ‘procedure’, ‘timing’ and ‘source’ of its learning process.[[rate 150]]
  [[ slnc 1300 ]]
 */
export async function say(
  text: string,
  voice: "Daniel" | "Samantha" = "Daniel",
) {
  await commandExec(`say -v "${voice}" "${text}"`);
}
