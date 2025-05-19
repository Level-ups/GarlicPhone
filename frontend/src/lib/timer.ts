import type { ElemTree } from "./parse";
import { der, eff, sig } from "./util/signal";

export function timer(seconds: number, callback: () => void = () => {}): ElemTree {
  const timeToEnd = Date.now() + seconds * 1000;
  const timeLeft = sig<number>(seconds * 1000);
  const time = der(() => {
    const min = Math.max(0, Math.floor(timeLeft() / (1000 * 60)));
    const sec = Math.max(0, Math.floor((timeLeft() / 1000) % 60));
    return `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
  });

  const clock = setInterval(() => {
    timeLeft(timeToEnd - Date.now());
  }, 100); // Tick down

  eff(() => {
    if (timeLeft() <= 0) {
        clearInterval(clock);
        callback();
    }
});

  return { "|p.timer": { _: time } };
}
