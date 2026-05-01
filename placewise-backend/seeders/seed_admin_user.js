'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const adminId = uuidv4();
    const officerId = uuidv4();
    const hash = await bcrypt.hash('Admin@12345', 12);
    const now = new Date();

    await queryInterface.bulkInsert('users', [{
      id:             adminId,
      email:          'admin@placewise.com',
      password_hash:  hash,
      role:           'admin',
      is_active:      true,
      email_verified: true,
      created_at:     now,
      updated_at:     now,
    }]);

    const placementUserId = uuidv4();
    const placementHash   = await bcrypt.hash('Placement@12345', 12);

    await queryInterface.bulkInsert('users', [{
      id:             placementUserId,
      email:          'placement@placewise.com',
      password_hash:  placementHash,
      role:           'placement',
      is_active:      true,
      email_verified: true,
      created_at:     now,
      updated_at:     now,
    }]);

    await queryInterface.bulkInsert('placement_officers', [{
      id:         officerId,
      user_id:    placementUserId,
      name:       'Placement Officer',
      department: 'Training & Placement Cell',
      created_at: now,
      updated_at: now,
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@placewise.com', 'placement@placewise.com'],
    });
  },
};