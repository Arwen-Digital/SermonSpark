export const socialMediaPostsPrompt = `Generate engaging social media post ideas for sermon promotion based on the provided content. Create 5-7 post ideas optimized for different platforms (Instagram, Facebook, Twitter/X, LinkedIn).

Input Type: {input_type}
Content: {content}

Requirements:
- Create posts optimized for different social media platforms
- Mix of formats: inspirational quotes, questions, action items, scripture highlights
- Each post should be engaging and shareable
- Include platform-specific recommendations (hashtags, character limits, etc.)
- Make posts authentic and relevant to the content provided
- Format as a numbered list with platform recommendations

Content Details:
{if_sermon_content}Sermon Title: {sermon_title}
Scripture Reference: {scripture_reference}
Sermon Content: {sermon_content}
{else}Topic: {topic}
Bible Verse: {bible_verse}
{/if}

Generate social media posts that will help promote your sermon content effectively across different platforms. Each post should be ready to use or easily adapted for the target platform.`;

