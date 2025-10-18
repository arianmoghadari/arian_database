'use strict';

const { Sequelize, DataTypes } = require('sequelize');

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || '3306';
const dbName = process.env.DB_NAME || 'arad_billboards';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: false,
    freezeTableName: false,
    timestamps: true,
  },
});

const User = sequelize.define('User', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user', 'seller', 'reporter'), allowNull: false, defaultValue: 'user' },
  status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
});

const City = sequelize.define('City', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
});

const Partner = sequelize.define('Partner', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  contactInfo: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
});

const Billboard = sequelize.define('Billboard', {
  billboardCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  title: { type: DataTypes.STRING },
  length: { type: DataTypes.FLOAT },
  width: { type: DataTypes.FLOAT },
  squareMeter: { type: DataTypes.FLOAT },
  position: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  priceNumber: { type: DataTypes.FLOAT },
  isReserved: { type: DataTypes.BOOLEAN, defaultValue: false },
  isEmpty: { type: DataTypes.BOOLEAN, defaultValue: true },
  isInactive: { type: DataTypes.BOOLEAN, defaultValue: false },
  isBroadcasting: { type: DataTypes.BOOLEAN, defaultValue: false },
  isCultural: { type: DataTypes.BOOLEAN, defaultValue: false },
  imageUrl: { type: DataTypes.STRING },
});

const ProductCard = sequelize.define('ProductCard', {
  title: { type: DataTypes.STRING },
  priceNumber: { type: DataTypes.FLOAT },
  imageUrl: { type: DataTypes.STRING },
});

const Reservation = sequelize.define('Reservation', {
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'expired'), defaultValue: 'pending' },
  reservedFrom: { type: DataTypes.DATE, allowNull: false },
  reservedTo: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT },
});

const Order = sequelize.define('Order', {
  status: { type: DataTypes.ENUM('draft', 'submitted', 'paid', 'cancelled'), defaultValue: 'draft' },
  totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
});

const OrderItem = sequelize.define('OrderItem', {
  qty: { type: DataTypes.INTEGER, defaultValue: 1 },
  unitPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  discountPercent: { type: DataTypes.FLOAT, defaultValue: 0 },
});

const Report = sequelize.define('Report', {
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('submitted', 'reviewed', 'rejected'), defaultValue: 'submitted' },
});

City.hasMany(Billboard, { foreignKey: { allowNull: false } });
Billboard.belongsTo(City);

Partner.hasMany(Billboard, { foreignKey: { allowNull: true } });
Billboard.belongsTo(Partner);

Billboard.hasOne(ProductCard, { foreignKey: { allowNull: false } });
ProductCard.belongsTo(Billboard);

Billboard.hasMany(Reservation);
Reservation.belongsTo(Billboard);

User.hasMany(Reservation);
Reservation.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

Order.hasMany(OrderItem, { onDelete: 'CASCADE' });
OrderItem.belongsTo(Order);

Billboard.hasMany(OrderItem);
OrderItem.belongsTo(Billboard);

// Reports relations
User.hasMany(Report, { as: 'reports', foreignKey: { name: 'authorId', allowNull: false } });
Report.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Billboard.hasMany(Report, { foreignKey: { name: 'billboardId', allowNull: false } });
Report.belongsTo(Billboard, { foreignKey: 'billboardId' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  City,
  Partner,
  Billboard,
  ProductCard,
  Reservation,
  Order,
  OrderItem,
  Report,
};

