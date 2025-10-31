export const discussionQuestionsPrompt = `Generate thoughtful Bible study discussion questions based on the provided content. Create 5 questions that encourage deep reflection and group discussion.

Input Type: {input_type}
Content: {content}

Requirements:
- Mix of question types: observation, interpretation, application, and personal reflection
- Start with easier questions and progress to deeper ones
- Include 1-2 questions about practical application
- Include 1-2 questions for personal reflection
- Make questions open-ended to encourage discussion
- Ensure questions are relevant to the content provided
- Format as a numbered list

Content Details:
{if_sermon_content}Sermon Title: {sermon_title}
Scripture Reference: {scripture_reference}
Sermon Content: {sermon_content}
{else}Topic: {topic}
Bible Verse: {bible_verse}
{/if}

Generate questions that will help a small group explore this topic meaningfully.`;

