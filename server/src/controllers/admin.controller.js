const { Organization, User, Role } = require('../models');

/**
 * Super Admin Controller for Platform Management
 */

// List ALL organizations in the platform
exports.getAllOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      include: [
        { 
          model: User, 
          as: 'owner',
          attributes: ['id', 'email', 'firstName', 'lastName'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List ALL users in the platform
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [Role, Organization],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Organization status (for blocking/activating)
exports.updateOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionStatus, trialEndsAt } = req.body;

    const org = await Organization.findByPk(id);
    if (!org) {
      return res.status(404).json({ message: 'Organización no encontrada' });
    }

    await org.update({
      subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : org.subscriptionStatus,
      trialEndsAt: trialEndsAt !== undefined ? trialEndsAt : org.trialEndsAt
    });

    res.json({ message: 'Organización actualizada correctamente', org });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle User Active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.update({ isActive: !user.isActive });
    res.json({ message: `Usuario ${user.isActive ? 'activado' : 'bloqueado'}`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new SuperAdmin
exports.createSuperAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        const superRole = await Role.findOne({ where: { name: 'SUPERADMIN' } });
        if (!superRole) return res.status(500).json({ message: 'Rol SUPERADMIN no encontrado' });

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'El correo electrónico ya está registrado' });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            username: email,
            roleId: superRole.id,
            accountType: 'HOSPITAL',
            isActive: true
        });

        res.status(201).json({ message: 'SuperAdministrador creado con éxito', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
