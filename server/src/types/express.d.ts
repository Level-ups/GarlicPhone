import { UserInfo } from './UserInfo'; // or define inline if simpler

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}
