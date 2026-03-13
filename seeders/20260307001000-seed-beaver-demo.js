'use strict';

const bcrypt = require('bcrypt');

const buildAgreementNumber = (agreementId, ownerId, tenantId, propertyId, date) => {
  const created = new Date(date);
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');

  return `BVR-${yy}-${mm}-${dd}-O${ownerId}-T${tenantId}-P${propertyId}-A${agreementId}`;
};

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Owner@123', 12);
    const tenantPasswordHash = await bcrypt.hash('Tenant@123', 12);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    const now = new Date();
    const inviteToken = 'demo-invite-token-beaver';

    await queryInterface.bulkInsert('users', [
      {
        user_id: 1,
        email: 'owner@beaver.rent',
        password_hash: passwordHash,
        full_name: 'Demo Owner',
        phone: '9876543210',
        address_line: 'Owner Street 12',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        role: 'owner',
        tier: 'pro',
        is_active: true,
        email_verified: true,
        refresh_token_version: 0,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 2,
        email: 'tenant@beaver.rent',
        password_hash: tenantPasswordHash,
        full_name: 'Demo Tenant',
        phone: '9123456780',
        address_line: 'Tenant Lane 8',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        role: 'tenant',
        tier: 'free',
        is_active: true,
        email_verified: true,
        refresh_token_version: 0,
        created_at: now,
        updated_at: now
      },
      {
        user_id: 3,
        email: 'admin@beaver.rent',
        password_hash: adminPasswordHash,
        full_name: 'Platform Admin',
        phone: '9000000001',
        address_line: 'Admin Avenue 1',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        role: 'admin',
        tier: 'pro',
        is_active: true,
        email_verified: true,
        refresh_token_version: 0,
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('properties', [
      {
        property_id: 1,
        owner_id: 1,
        name: 'Green Residency Flat 302',
        type: 'flat',
        address_line: 'MG Road, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        rent_amount: 25000,
        deposit_amount: 50000,
        description: 'Furnished 2BHK flat',
        photos: JSON.stringify([]),
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('invites', [
      {
        invite_id: 1,
        token: inviteToken,
        property_id: 1,
        email: 'tenant@beaver.rent',
        invited_by: 1,
        used_by: 2,
        status: 'used',
        expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('agreements', [
      {
        agreement_id: 1,
        agreement_number: buildAgreementNumber(1, 1, 2, 1, now),
        property_id: 1,
        owner_id: 1,
        tenant_id: 2,
        invite_id: 1,
        start_date: '2026-03-01',
        end_date: '2027-02-28',
        rent_amount: 25000,
        deposit_amount: 50000,
        rent_due_day: 5,
        gst_rate: 18,
        status: 'active',
        terms: JSON.stringify({ template: 'rera-basic', noticePeriodDays: 30 }),
        pdf_url: null,
        accepted_at: now,
        rejected_at: null,
        rejection_reason: null,
        activated_at: now,
        closed_at: null,
        closed_reason: null,
        revoked_at: null,
        revoke_reason: null,
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('agreement_events', [
      {
        event_id: 1,
        agreement_id: 1,
        actor_id: 2,
        event_type: 'agreement_accepted',
        title: 'Agreement accepted by tenant',
        description: 'Tenant accepted the seeded agreement and it became active.',
        metadata: JSON.stringify({ status: 'active' }),
        created_at: now
      }
    ], {});

    await queryInterface.bulkInsert('transactions', [
      {
        transaction_id: 1,
        agreement_id: 1,
        paid_by: 2,
        type: 'rent',
        amount: 25000,
        gst_amount: 4500,
        razorpay_order_id: 'order_demo_001',
        razorpay_payment_id: 'pay_demo_001',
        razorpay_signature: 'sig_demo_001',
        status: 'completed',
        due_date: '2026-03-05',
        paid_at: now,
        description: 'March rent payment',
        hash: 'demo_hash_001',
        previous_hash: null,
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('chats', [
      {
        chat_id: 1,
        agreement_id: 1,
        sender_id: 2,
        message: 'Hi, I have completed the rent payment.',
        image_url: null,
        read_at: null,
        created_at: now,
        updated_at: now
      }
    ], {});

    await queryInterface.bulkInsert('notifications', [
      {
        notification_id: 1,
        user_id: 1,
        type: 'payment',
        title: 'Rent Paid',
        message: 'Demo Tenant completed rent payment for Green Residency Flat 302.',
        metadata: JSON.stringify({ agreement_id: 1, transaction_id: 1 }),
        read_at: null,
        sent_via: 'inapp',
        created_at: now,
        updated_at: now
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('chats', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('agreement_events', null, {});
    await queryInterface.bulkDelete('agreements', null, {});
    await queryInterface.bulkDelete('invites', null, {});
    await queryInterface.bulkDelete('properties', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
