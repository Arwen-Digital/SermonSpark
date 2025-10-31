export const blogPostIdeasPrompt = `Generate blog post ideas and write a complete blog post example based on the provided sermon content.

Input Type: {input_type}
Content: {content}

Content Details:
{if_sermon_content}Sermon Title: {sermon_title}
Scripture Reference: {scripture_reference}
Sermon Content: {sermon_content}
{else}Topic: {topic}
Bible Verse: {bible_verse}
{/if}

**PART 1: Blog Post Ideas**
Generate 5 simple blog post ideas related to this content. For each idea, provide:
- A compelling title (50-70 characters)
- A brief one-sentence description of what the post would cover

Format as a numbered list with clear titles.

**PART 2: Complete Blog Post Example**
Write a complete, ready-to-publish blog post example (400-600 words total) based on one of the ideas above or the sermon content.

Structure your blog post with:
1. **Title**: Compelling, SEO-optimized headline
2. **Introduction** (75-100 words): Hook the reader, introduce the topic, state the main point
3. **Main Body** (250-400 words): 
   - Develop key themes from the sermon content
   - Include relevant scripture references
   - Provide practical insights and applications
   - Use subheadings to organize sections
4. **Conclusion** (75-100 words): Summarize key points, provide a call to action or reflection question

Write in a warm, engaging tone that makes biblical truth accessible and applicable to everyday life. The blog post should feel authentic and encourage readers to engage with the content deeply.

Separate the two sections clearly with headings: "Blog Post Ideas" and "Blog Post Example".`;

