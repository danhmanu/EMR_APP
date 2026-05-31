using System.Collections.Generic;

namespace EMR.Application.DTO.Admin
{
    public record CreateRoleRequest(string? Code, string? Name);

    public record CreateAdminUserRequest(
        string? Username,
        string? DisplayName,
        string? Position,
        string? EmployeeCode,
        string? Email,
        string? PasswordHash,
        int? RoleId,
        int? DepartmentId,
        bool IsActive);

    public record AssignMenuRequest(IReadOnlyList<int>? MenuItemIds);

    public record CreatePermissionItemRequest(string? Code, string? Description);

    public record UpdatePermissionItemRequest(string? Code, string? Description);

    public record AssignPermissionsRequest(IReadOnlyList<int>? PermissionItemIds);
}
