'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('Users', [{
      fullName: 'مدیر سیستم',
      email: 'admin@arad.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Create regular user
    const userPasswordHash = await bcrypt.hash('user123', 10);
    await queryInterface.bulkInsert('Users', [{
      fullName: 'کاربر تست',
      email: 'user@arad.com',
      passwordHash: userPasswordHash,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Create cities
    await queryInterface.bulkInsert('Cities', [
      {
        name: 'تهران',
        slug: 'tehran',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'اصفهان',
        slug: 'isfahan',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'شیراز',
        slug: 'shiraz',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'مشهد',
        slug: 'mashhad',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'تبریز',
        slug: 'tabriz',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'پردیس',
        slug: 'pardis',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create partners
    await queryInterface.bulkInsert('Partners', [
      {
        name: 'شرکت تبلیغاتی آراد',
        contactInfo: 'تهران، خیابان ولیعصر، پلاک 123',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'شرکت رسانه‌ای پارس',
        contactInfo: 'اصفهان، خیابان چهارباغ، پلاک 456',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'شرکت تبلیغاتی شیراز',
        contactInfo: 'شیراز، خیابان زند، پلاک 789',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'نامشخص',
        contactInfo: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Get created records for foreign keys
    const cities = await queryInterface.sequelize.query('SELECT id, name FROM Cities', { type: Sequelize.QueryTypes.SELECT });
    const partners = await queryInterface.sequelize.query('SELECT id, name FROM Partners', { type: Sequelize.QueryTypes.SELECT });

    const tehran = cities.find(c => c.name === 'تهران');
    const isfahan = cities.find(c => c.name === 'اصفهان');
    const shiraz = cities.find(c => c.name === 'شیراز');
    const mashhad = cities.find(c => c.name === 'مشهد');
    const tabriz = cities.find(c => c.name === 'تبریز');
    const pardis = cities.find(c => c.name === 'پردیس');

    const arad = partners.find(p => p.name === 'شرکت تبلیغاتی آراد');
    const pars = partners.find(p => p.name === 'شرکت رسانه‌ای پارس');
    const shirazPartner = partners.find(p => p.name === 'شرکت تبلیغاتی شیراز');
    const unknown = partners.find(p => p.name === 'نامشخص');

    // Create billboards
    await queryInterface.bulkInsert('Billboards', [
      {
        billboardCode: 'T001',
        title: 'بیلبورد بزرگراه آزادگان',
        length: 6.0,
        width: 3.0,
        squareMeter: 18.0,
        position: 'بزرگراه آزادگان، کیلومتر 15',
        region: 'جنوب تهران',
        priceNumber: 500.0,
        isReserved: false,
        isEmpty: true,
        isInactive: false,
        isBroadcasting: false,
        isCultural: false,
        imageUrl: '/images/products/h1.jpg',
        cityId: tehran.id,
        partnerId: arad.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'T002',
        title: 'بیلبورد خیابان ولیعصر',
        length: 4.0,
        width: 3.0,
        squareMeter: 12.0,
        position: 'خیابان ولیعصر، تقاطع طالقانی',
        region: 'مرکز تهران',
        priceNumber: 800.0,
        isReserved: true,
        isEmpty: false,
        isInactive: false,
        isBroadcasting: true,
        isCultural: false,
        imageUrl: '/images/products/h2.jpg',
        cityId: tehran.id,
        partnerId: arad.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'I001',
        title: 'بیلبورد چهارباغ اصفهان',
        length: 5.0,
        width: 3.0,
        squareMeter: 15.0,
        position: 'خیابان چهارباغ، نزدیک میدان نقش جهان',
        region: 'مرکز اصفهان',
        priceNumber: 600.0,
        isReserved: false,
        isEmpty: true,
        isInactive: false,
        isBroadcasting: false,
        isCultural: true,
        imageUrl: '/images/products/h3.jpg',
        cityId: isfahan.id,
        partnerId: pars.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'S001',
        title: 'بیلبورد خیابان زند شیراز',
        length: 4.5,
        width: 3.0,
        squareMeter: 13.5,
        position: 'خیابان زند، تقاطع کریمخان زند',
        region: 'مرکز شیراز',
        priceNumber: 450.0,
        isReserved: false,
        isEmpty: true,
        isInactive: false,
        isBroadcasting: false,
        isCultural: false,
        imageUrl: '/images/products/h4.jpg',
        cityId: shiraz.id,
        partnerId: shirazPartner.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'M001',
        title: 'بیلبورد حرم امام رضا',
        length: 6.0,
        width: 4.0,
        squareMeter: 24.0,
        position: 'بلوار امام رضا، نزدیک حرم',
        region: 'مرکز مشهد',
        priceNumber: 1000.0,
        isReserved: false,
        isEmpty: true,
        isInactive: false,
        isBroadcasting: false,
        isCultural: true,
        imageUrl: '/images/products/h5.jpg',
        cityId: mashhad.id,
        partnerId: unknown.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'TZ001',
        title: 'بیلبورد بازار تبریز',
        length: 3.0,
        width: 2.0,
        squareMeter: 6.0,
        position: 'بازار تبریز، ورودی اصلی',
        region: 'مرکز تبریز',
        priceNumber: 300.0,
        isReserved: false,
        isEmpty: true,
        isInactive: true,
        isBroadcasting: false,
        isCultural: false,
        imageUrl: '/images/products/h6.jpg',
        cityId: tabriz.id,
        partnerId: unknown.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        billboardCode: 'P001',
        title: 'بیلبورد شهرک پردیس',
        length: 4.0,
        width: 2.5,
        squareMeter: 10.0,
        position: 'شهرک پردیس، خیابان اصلی',
        region: 'پردیس',
        priceNumber: 350.0,
        isReserved: false,
        isEmpty: true,
        isInactive: false,
        isBroadcasting: false,
        isCultural: false,
        imageUrl: '/images/products/h7.jpg',
        cityId: pardis.id,
        partnerId: arad.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Get billboards for product cards
    const billboards = await queryInterface.sequelize.query('SELECT id, billboardCode, title, priceNumber, imageUrl FROM Billboards', { type: Sequelize.QueryTypes.SELECT });

    // Create product cards for each billboard
    const productCards = billboards.map(bb => ({
      title: bb.title,
      priceNumber: bb.priceNumber,
      imageUrl: bb.imageUrl,
      billboardId: bb.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('ProductCards', productCards);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductCards', null, {});
    await queryInterface.bulkDelete('Billboards', null, {});
    await queryInterface.bulkDelete('Partners', null, {});
    await queryInterface.bulkDelete('Cities', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
