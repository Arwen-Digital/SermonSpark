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
import type * as functions_generateBlogPostIdeas from "../functions/generateBlogPostIdeas.js";
import type * as functions_generateDiscussionQuestions from "../functions/generateDiscussionQuestions.js";
import type * as functions_generateHistoricalContext from "../functions/generateHistoricalContext.js";
import type * as functions_generateIllustration from "../functions/generateIllustration.js";
import type * as functions_generateLanguageStudy from "../functions/generateLanguageStudy.js";
import type * as functions_generateOutline from "../functions/generateOutline.js";
import type * as functions_generateSermonTitles from "../functions/generateSermonTitles.js";
import type * as functions_generateSocialMediaPosts from "../functions/generateSocialMediaPosts.js";
import type * as functions_generateTopicExploration from "../functions/generateTopicExploration.js";
import type * as profiles from "../profiles.js";
import type * as prompts_blogPostIdeas from "../prompts/blogPostIdeas.js";
import type * as prompts_discussionQuestions from "../prompts/discussionQuestions.js";
import type * as prompts_historicalContext from "../prompts/historicalContext.js";
import type * as prompts_illustration from "../prompts/illustration.js";
import type * as prompts_languageStudy from "../prompts/languageStudy.js";
import type * as prompts_outline from "../prompts/outline.js";
import type * as prompts_sermonTitles from "../prompts/sermonTitles.js";
import type * as prompts_socialMediaPosts from "../prompts/socialMediaPosts.js";
import type * as prompts_topicExplorer from "../prompts/topicExplorer.js";
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
  "functions/generateBlogPostIdeas": typeof functions_generateBlogPostIdeas;
  "functions/generateDiscussionQuestions": typeof functions_generateDiscussionQuestions;
  "functions/generateHistoricalContext": typeof functions_generateHistoricalContext;
  "functions/generateIllustration": typeof functions_generateIllustration;
  "functions/generateLanguageStudy": typeof functions_generateLanguageStudy;
  "functions/generateOutline": typeof functions_generateOutline;
  "functions/generateSermonTitles": typeof functions_generateSermonTitles;
  "functions/generateSocialMediaPosts": typeof functions_generateSocialMediaPosts;
  "functions/generateTopicExploration": typeof functions_generateTopicExploration;
  profiles: typeof profiles;
  "prompts/blogPostIdeas": typeof prompts_blogPostIdeas;
  "prompts/discussionQuestions": typeof prompts_discussionQuestions;
  "prompts/historicalContext": typeof prompts_historicalContext;
  "prompts/illustration": typeof prompts_illustration;
  "prompts/languageStudy": typeof prompts_languageStudy;
  "prompts/outline": typeof prompts_outline;
  "prompts/sermonTitles": typeof prompts_sermonTitles;
  "prompts/socialMediaPosts": typeof prompts_socialMediaPosts;
  "prompts/topicExplorer": typeof prompts_topicExplorer;
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
