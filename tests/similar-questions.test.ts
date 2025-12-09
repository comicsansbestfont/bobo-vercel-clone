/**
 * Tests for Similar Questions functionality (M3.13-08)
 */

import { describe, it, expect } from '@jest/globals';
import { isQuestion } from '@/lib/ai/similar-questions';

describe('Similar Questions - isQuestion()', () => {
  it('should detect questions with question marks', () => {
    expect(isQuestion('What is AI?')).toBe(true);
    expect(isQuestion('How does this work?')).toBe(true);
    expect(isQuestion('Can you help me?')).toBe(true);
  });

  it('should detect questions starting with question words', () => {
    expect(isQuestion('What is the capital of France')).toBe(true);
    expect(isQuestion('Why did you do that')).toBe(true);
    expect(isQuestion('How can I improve')).toBe(true);
    expect(isQuestion('When will it be ready')).toBe(true);
    expect(isQuestion('Where is the file')).toBe(true);
    expect(isQuestion('Who created this')).toBe(true);
    expect(isQuestion('Which option is better')).toBe(true);
  });

  it('should detect questions with modal verbs', () => {
    expect(isQuestion('Can I do this')).toBe(true);
    expect(isQuestion('Should we proceed')).toBe(true);
    expect(isQuestion('Would that work')).toBe(true);
    expect(isQuestion('Could you explain')).toBe(true);
    expect(isQuestion('Will it be ready')).toBe(true);
  });

  it('should detect questions with to-be verbs', () => {
    expect(isQuestion('Is this correct')).toBe(true);
    expect(isQuestion('Are you sure')).toBe(true);
    expect(isQuestion('Was it successful')).toBe(true);
    expect(isQuestion('Were they there')).toBe(true);
  });

  it('should detect questions with do/have verbs', () => {
    expect(isQuestion('Do you understand')).toBe(true);
    expect(isQuestion('Does it work')).toBe(true);
    expect(isQuestion('Did you finish')).toBe(true);
    expect(isQuestion('Have you seen this')).toBe(true);
    expect(isQuestion('Has anyone checked')).toBe(true);
  });

  it('should NOT detect non-questions', () => {
    expect(isQuestion('This is a statement.')).toBe(false);
    expect(isQuestion('I like programming.')).toBe(false);
    expect(isQuestion('Please do this task.')).toBe(false);
    expect(isQuestion('The answer is 42.')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isQuestion('')).toBe(false);
    expect(isQuestion('   ')).toBe(false);
    expect(isQuestion('   What is this?   ')).toBe(true); // Trimmed
  });

  it('should be case-insensitive for question words', () => {
    expect(isQuestion('WHAT IS THIS')).toBe(true);
    expect(isQuestion('What IS THIS')).toBe(true);
    expect(isQuestion('what is this')).toBe(true);
  });

  it('should handle punctuation in first word', () => {
    expect(isQuestion('"What is this?"')).toBe(true);
    expect(isQuestion('(Can you help)')).toBe(true);
  });
});

// Note: getSimilarQuestions() requires database connection
// and should be tested with integration tests
