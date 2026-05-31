namespace EMR.Application.DTO.Auth
{
    public record LoginRequest(string? Username, string? Password);

    public record LoginResponseDto(
        string Token,
        int UserId,
        string? Username,
        string? DisplayName,
        string Role,
        int? DepartmentId);

    public record MyPermissionsDto(
        int UserId,
        string? Username,
        string? DisplayName,
        int? DepartmentId,
        string Role,
        string Mode,
        string[] Permissions);

    public record MyProfileDto(
        int Id,
        string? Username,
        string? DisplayName,
        string? Email,
        string? Position,
        string? EmployeeCode,
        int? RoleId,
        string Role,
        int? DepartmentId);

    public record UpdateMyProfileRequest(string? DisplayName, string? Email, string? Position, string? EmployeeCode);

    public record ChangeMyPasswordRequest(string? CurrentPassword, string? NewPassword);
}