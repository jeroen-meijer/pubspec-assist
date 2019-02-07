import { PubApiNotRespondingError } from "../model/pubError";
import { showRetryableError, showCriticalError } from "./messaging";

const getValue = async <T>(f: () => T) => {
  let value: T | undefined;
  let tryAgain = true;

  while (tryAgain) {
    try {
      value = await f();
      tryAgain = false;
    } catch (error) {
      if (error instanceof PubApiNotRespondingError) {
        tryAgain = await showRetryableError(error);
      } else {
        showCriticalError(error);
        tryAgain = false;
      }
    }
  }

  return value;
};

export { getValue };
