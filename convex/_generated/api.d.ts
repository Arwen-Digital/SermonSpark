/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bible from "../bible.js";
import type * as bibleCache from "../bibleCache.js";
import type * as community from "../community.js";
import type * as profiles from "../profiles.js";
import type * as series from "../series.js";
import type * as sermons from "../sermons.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  bible: typeof bible;
  bibleCache: typeof bibleCache;
  community: typeof community;
  profiles: typeof profiles;
  series: typeof series;
  sermons: typeof sermons;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
