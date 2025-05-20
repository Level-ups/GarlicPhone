import { react, type ElemTree } from "./parse";
import { der, eff, sig } from "./util/signal";

export function timerTill(timeToEnd: number, callback: () => void = () => {}): ElemTree {
  const timeLeft = sig<number>(timeToEnd - Date.now());
  const time = der(() => {
    const min = Math.max(0, Math.floor(timeLeft() / (1000 * 60)));
    const sec = Math.max(0, Math.floor((timeLeft() / 1000) % 60));
    return `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
  });

  const ended = der(() => timeLeft() <= 0);

  const clock = setInterval(() => {
    timeLeft(timeToEnd - Date.now());
  }, 100); // Tick down

  eff(() => {
    if (timeLeft() <= 0) {
      clearInterval(clock);
      callback();
    }
});

  return react([ended], () => ended() ?
  ({ "|p.timer": { "|span.timer-loader": {} } }) :
  ({ "|p.timer": { _: time } }));
}

export function timer(seconds: number, callback: () => void = () => {}): ElemTree {
  const timeToEnd = Date.now() + seconds * 1000;
  return timerTill(timeToEnd, callback);
}
