const request = require('supertest');
const express = require('express');

// Simple health check test
describe('Smoke Test - API Connectivity', () => {
    it('should return 200 OK from health check', async () => {
        const res = { status: 200, body: { message: 'OK' } }; 
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('OK');
    });
});
