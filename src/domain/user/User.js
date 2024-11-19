class User {
  constructor({ id, email, password, role, status, lastLogin, metadata }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role;
    this.status = status;
    this.lastLogin = lastLogin;
    this.metadata = metadata;
  }

  isActive() {
    return this.status === 'active';
  }

  canAccessAdmin() {
    return ['admin', 'superadmin'].includes(this.role);
  }

  updateLastLogin() {
    this.lastLogin = new Date();
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}