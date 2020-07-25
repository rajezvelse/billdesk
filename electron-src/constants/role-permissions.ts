export const RolePermissions: { [groupName: string]: string[] } = {
    Users: ['create_users', 'update_users', 'view_users', 'delete_users'],
    Roles: ['create_roles', 'update_roles', 'view_roles', 'delete_roles']
}