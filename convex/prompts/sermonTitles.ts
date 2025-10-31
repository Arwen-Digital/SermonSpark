export const sermonTitlesPrompt = `Generate 10 compelling sermon titles based on this sermon content. Return only a JSON array of strings with no additional text or formatting.

Sermon Content: {sermon_content}
Scripture Reference: {scripture_reference}
Current Title: {current_title}
Tags: {tags}

Requirements:
- Each title should be engaging and clickable
- Mix of emotional, action-oriented, and question formats
- Include 1-2 titles that reference the scripture directly
- Keep titles under 80 characters
- Make them memorable and shareable

JSON Format: ["Title 1", "Title 2", "Title 3", ...]`;

