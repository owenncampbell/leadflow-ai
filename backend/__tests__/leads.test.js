const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const leadRoutes = require('../routes/leads');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const Lead = require('../models/Lead');
const OpenAI = require('openai');

jest.setTimeout(20000);

jest.mock('openai');

const app = express();
app.use(express.json());
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);

let mongoServer;
let token;
let userId;

beforeAll(async () => {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Register and login a user to get a token
    await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });
    
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
    
    token = res.body.token;
    const user = await User.findOne({ email: 'test@example.com' });
    userId = user._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Lead.deleteMany({});
});

describe('Leads API', () => {
    it('should get all leads for a user', async () => {
        await new Lead({
            user: userId,
            projectDescription: 'Test Project',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
        }).save();

        const res = await request(app)
            .get('/api/leads')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].clientName).toBe('Test Client');
    });

    it('should create a new lead with AI analysis', async () => {
        const create = jest.fn().mockResolvedValue({
            choices: [{
                message: {
                    content: JSON.stringify({
                        summary: 'A test summary.',
                        category: 'Testing',
                        costEstimate: '$100',
                        materialList: ['Test Material'],
                        laborBreakdown: ['Test Labor'],
                        permitRequired: 'No',
                        draftEmail: 'Test Email',
                    }),
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

        const res = await request(app)
            .post('/api/leads/analyze')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectDescription: 'A new test project',
                clientName: 'New Client',
                clientEmail: 'new@client.com',
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('aiSummary', 'A test summary.');
        const leadInDb = await Lead.findById(res.body._id);
        expect(leadInDb).not.toBeNull();
    });

    it('should update a lead status', async () => {
        const lead = await new Lead({
            user: userId,
            projectDescription: 'Test Project',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
        }).save();

        const res = await request(app)
            .put(`/api/leads/${lead._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'Contacted' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('Contacted');
    });

    it('should delete a lead', async () => {
        const lead = await new Lead({
            user: userId,
            projectDescription: 'Test Project',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
        }).save();

        const res = await request(app)
            .delete(`/api/leads/${lead._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        const leadInDb = await Lead.findById(lead._id);
        expect(leadInDb).toBeNull();
    });

    it('should generate a PDF proposal', async () => {
        const lead = await new Lead({
            user: userId,
            projectDescription: 'Test Project',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
            aiSummary: 'Summary',
            aiLaborBreakdown: ['Labor'],
            aiMaterialList: ['Material'],
            aiCostEstimate: '$100',
        }).save();

        const res = await request(app)
            .get(`/api/leads/${lead._id}/proposal`)
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(res.header['content-type']).toBe('application/pdf');
    });

    it('should add a note to a lead', async () => {
        const lead = await new Lead({
            user: userId,
            projectDescription: 'Test Project',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
        }).save();

        const res = await request(app)
            .post(`/api/leads/${lead._id}/notes`)
            .set('Authorization', `Bearer ${token}`)
            .send({ text: 'Followed up via email.' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.notes[0].text).toBe('Followed up via email.');
    });
});
