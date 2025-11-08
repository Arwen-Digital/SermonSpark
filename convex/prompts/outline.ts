export const outlinePrompt = `Create a comprehensive sermon outline with the following parameters:
- **Outline Type**: {outline_type}
- **Topic**: {sermon_topic}
- **Scripture**: 2 Cor 9
- **Preacher Style/Inspiration**: {preacher}

**Outline Type Specifications:**
- **Point-Progress**: Clear progression through main points (P1, P2, P3...)
- **Problem-Solution**: Identify the problem then provide Christ's solution
- **Story Narrative**: Use biblical narrative structure with introduction, conflict, climax, resolution
- **Question-Answer**: Pose key questions and provide biblical answers
- **Biographical**: Focus on character development and lessons from the person featured
- **Expository**: Follow the natural flow of the biblical text verse by verse
- **Topical**: Address different aspects of the broader topic
- **Series Format**: Design for multi-part sermon series continuation

**Required Elements:**

**1. Sermon Structure (30-45 minutes total):**
- **Introduction** (3-5 minutes): Hook, Scripture reading, preview of main points
- **Main Body** (25-35 minutes): 2-4 main points with subpoints
- **Conclusion** (5-7 minutes): Summary, application, invitation

**2. For Each Main Point:**
- **Clear statement** of the point
- **Scripture reference(s)** supporting the point
- **Supporting evidence** (illustration, example, or explanation)
- **Practical application** for congregation
- **Transition** to next point

**3. Biblical Integration:**
- **Primary passage**: Full text consideration from {bible_verse}
- **Supporting passages**: Cross-references that illuminate the topic
- **Context**: Historical, cultural, or theological background
- **Christ-centered focus**: How Jesus fulfills or embodies this truth

**4. Homiletical Style ({preacher}):**
- **Delivery approach**: [Adapt style based on preacher inspiration]
- **Tone**: [Match the emotional feel of the preacher's style]
- **Illustrations preference**: [General guidance based on preacher style]
- **Application emphasis**: [Focus areas relevant to this preaching style]

**5. Application Requirements:**
- **Personal**: Individual heart-level application
- **Relational**: How it affects family and community relationships
- **Practical**: Specific next steps or life changes
- **Eternal**: Long-term spiritual growth implications

**6. Final Deliverables:**
- **Sermon title** (catchy and clear)
- **Main theme statement** (one sentence summary)
- **Series continuity** (if applicable, how this fits the larger series)
- **Follow-up materials** (discussion questions, recommended reading, etc.)

**Length**: 400-800 words for the complete outline

**Output Format**:
- Clear hierarchical structure with proper formatting
- Scripture references in proper citation format
- Practical application suggestions after each point
- Notes on preacher style integration throughout`;

