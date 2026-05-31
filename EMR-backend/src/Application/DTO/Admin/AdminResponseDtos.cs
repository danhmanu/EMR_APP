using EMR.Domain.Entities;

namespace EMR.Application.DTO.Admin
{
    public record RoleDto(int Id, string? Code, string? Name);

    public record AdminUserDto(
        int Id,
        string? Username,
        string? DisplayName,
        string? Position,
        string? EmployeeCode,
        string? Email,
        int? RoleId,
        int? DepartmentId,
        bool IsDeleted,
        bool IsActive);

    public record MenuItemDto(
        int Id,
        string? Key,
        string? Title,
        string? Link,
        string? Icon,
        int DisplayOrder,
        int? ParentMenuItemId,
        bool IsDeleted);

    public record PermissionItemDto(int Id, string Code, string? Description);

    public static class AdminDtoMappings
    {
        public static RoleDto ToDto(this Role role) =>
            new(role.Id, role.Code, role.Name);

        public static AdminUserDto ToDto(this User user) =>
            new(
                user.Id,
                user.Username,
                user.DisplayName,
                user.Position,
                user.EmployeeCode,
                user.Email,
                user.RoleId,
                user.DepartmentId,
                user.IsDeleted,
                user.IsActive);

        public static MenuItemDto ToDto(this MenuItem menuItem) =>
            new(
                menuItem.Id,
                menuItem.Key,
                menuItem.Title,
                menuItem.Link,
                menuItem.Icon,
                menuItem.DisplayOrder,
                menuItem.ParentMenuItemId,
                menuItem.IsDeleted);

        public static PermissionItemDto ToDto(this PermissionItem permissionItem) =>
            new(permissionItem.Id, permissionItem.Code, permissionItem.Description);
    }
}
