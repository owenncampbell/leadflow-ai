const { analyzeProject } = require('../services/aiService');
const OpenAI = require('openai');

jest.mock('openai');

describe('AI Service', () => {
    it('should call OpenAI with sanitized inputs', async () => {
        const create = jest.fn().mockResolvedValue({
            choices: [{
                message: {
                    content: JSON.stringify({ summary: 'Test' }),
                },
            }],
        });
        OpenAI.mockImplementation(() => ({
            chat: {
                completions: {
                    create,
                },
            },
        }));

        await analyzeProject('`project`', '${client}');

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({
                    content: expect.stringContaining('Project Description: "project"')
                })
            ])
        }));
        
        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({
                    content: expect.stringContaining('client named "client"')
                })
            ])
        }));
    });

    it('should throw an error if project description is missing', async () => {
        await expect(analyzeProject('', 'client')).rejects.toThrow('Missing required project description or client name.');
    });

    it('should throw an error if AI response is not valid JSON', async () => {
        const create = jest.fn().mockResolvedValue({
            choices: [{
                message: {
                    content: 'not json',
                },
            }],
        });
        OpenAI.mockImplementation(() => ({
            chat: {
                completions: {
                    create,
                },
            },
        }));

        await expect(analyzeProject('project', 'client')).rejects.toThrow('Failed to parse AI response.');
    });
});
