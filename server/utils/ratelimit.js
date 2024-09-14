import { setCache, getCache } from "../facilites/redis.js";
import errorHandler from "./error.js";

const rateLimit = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const userId = user.id;
    const cacheKey = `userId:${userId}`;
    let cacheUser = await getCache(cacheKey);

    if (cacheUser) {
      if (cacheUser.requestnum > 10) {
        return next(errorHandler(400, "Request limit exceeded"));
      } else {
        cacheUser = { ...cacheUser, requestnum: cacheUser.requestnum + 1 };
        await setCache(cacheKey, cacheUser, 600);
      }
    } else {
      cacheUser = { ...req.user, requestnum: 1 };
      await setCache(cacheKey, cacheUser, 600);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default rateLimit;
