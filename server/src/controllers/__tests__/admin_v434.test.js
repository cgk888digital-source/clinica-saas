const request = require('supertest');
const express = require('express');
const adminRoutes = require('../../routes/admin.routes');
const { User, Role, Organization, sequelize } = require('../../models');

// Mock express app para testing
const app = express();
app.use(express.json());

jest.mock('../../middlewares/auth.middleware', () => (req, res, next) => {
    req.user = { id: 'admin-uuid', role: 'SUPERADMIN' };
    next();
});
jest.mock('../../middlewares/context.middleware', () => (req, res, next) => next());
jest.mock('../../middlewares/role.middleware', () => (roles) => (req, res, next) => next());

app.use('/api/admin', adminRoutes);

// Mock database
jest.mock('../../models', () => {
  return {
    User: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn(),
      count: jest.fn(),
    },
    Role: {
      findOne: jest.fn(),
      findOrCreate: jest.fn(),
    },
    Organization: {
      count: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    },
    sequelize: {
      authenticate: jest.fn(),
      sync: jest.fn(),
    }
  };
});

// Mock Seeder
jest.mock('../../seeders/seeder', () => jest.fn());

describe('Admin Controller v4.3.4 - Adaptation & Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users (Visibility Filter)', () => {
    it('should filter out SUPERADMINs when requested by PLATFORM_ADMIN', async () => {
      // Mock requesting user as PLATFORM_ADMIN
      User.findByPk.mockResolvedValueOnce({ id: 'pa-uuid', Role: { name: 'PLATFORM_ADMIN' } });
      
      const mockUsers = [
        { id: '1', firstName: 'User 1', Role: { name: 'DOCTOR' } },
        { id: '2', firstName: 'Admin 1', Role: { name: 'SUPERADMIN' } }
      ];
      
      User.findAll.mockResolvedValue([mockUsers[0]]); // Simulation of the filter

      const res = await request(app)
        .get('/api/admin/users')
        .set('user', JSON.stringify({ id: 'pa-uuid', role: 'PLATFORM_ADMIN' })); // Not used by mock but good practice

      expect(User.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          '$Role.name$': expect.anything()
        })
      }));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].Role.name).not.toBe('SUPERADMIN');
    });
  });

  describe('PUT /api/admin/users/:id/toggle-status (Security)', () => {
    it('should block PLATFORM_ADMIN from modifying a SUPERADMIN', async () => {
      // Target user is SUPERADMIN
      const targetUser = { id: 'sa-uuid', Role: { name: 'SUPERADMIN' } };
      User.findByPk.mockResolvedValueOnce(targetUser); // For target
      
      // Requesting user is PLATFORM_ADMIN
      User.findByPk.mockResolvedValueOnce({ id: 'pa-uuid', Role: { name: 'PLATFORM_ADMIN' } }); // For check
      
      const res = await request(app).put('/api/admin/users/sa-uuid/toggle-status');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('No tienes permisos');
    });

    it('should allow PLATFORM_ADMIN to modify regular users', async () => {
        const targetUser = { id: 'doc-uuid', Role: { name: 'DOCTOR' }, update: jest.fn().mockResolvedValue(true), isActive: false };
        User.findByPk.mockResolvedValueOnce(targetUser);
        User.findByPk.mockResolvedValueOnce({ id: 'pa-uuid', Role: { name: 'PLATFORM_ADMIN' } });

        const res = await request(app).put('/api/admin/users/doc-uuid/toggle-status');
        expect(res.status).toBe(200);
        expect(targetUser.update).toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/platform-admins (Resilience)', () => {
    it('should attempt to seed roles if PLATFORM_ADMIN is not found', async () => {
      const seedRoles = require('../../seeders/seeder');
      
      Role.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'role-uuid', name: 'PLATFORM_ADMIN' });
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 'new-user-uuid' });

      const res = await request(app)
        .post('/api/admin/platform-admins')
        .send({
          firstName: 'New',
          lastName: 'Admin',
          email: 'admin@platform.com',
          password: 'Password123'
        });

      expect(seedRoles).toHaveBeenCalled();
      expect(res.status).toBe(201);
      expect(res.body.message).toContain('éxito');
    });
  });
});
