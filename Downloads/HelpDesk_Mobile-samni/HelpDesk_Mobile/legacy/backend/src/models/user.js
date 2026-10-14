const { DataTypes } = require('sequelize');

const ROLES = ['customer', 'provider', 'admin'];

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(...ROLES),
        allowNull: false,
        defaultValue: 'customer',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      // Never load the password hash unless explicitly asked for
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
    }
  );

  // Safety net: the hash must never appear in an API response
  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  User.ROLES = ROLES;

  return User;
};
