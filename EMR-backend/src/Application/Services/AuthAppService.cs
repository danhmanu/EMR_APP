using System;
using System.Linq;
using System.Threading.Tasks;
using EMR.Application.DTO.Auth;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using EMR.Domain.Security;
using Microsoft.EntityFrameworkCore;

namespace EMR.Application.Services
{
    public class AuthAppService : IAuthAppService
    {
        private readonly IUserService _userService;
        private readonly IAuthService _authService;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<Role> _roleRepo;
        private readonly IRepository<PermissionRoleMap> _permissionRoleMapRepo;
        private readonly IRepository<PermissionItem> _permissionItemRepo;

        public AuthAppService(
            IUserService userService,
            IAuthService authService,
            IUnitOfWork unitOfWork)
        {
            _userService = userService;
            _authService = authService;
            _userRepo = unitOfWork.Repository<User>();
            _roleRepo = unitOfWork.Repository<Role>();
            _permissionRoleMapRepo = unitOfWork.Repository<PermissionRoleMap>();
            _permissionItemRepo = unitOfWork.Repository<PermissionItem>();
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
        {
            if (request == null)
                throw new ValidationException("Invalid request");

            var user = await _userService.AuthenticateAsync(
                request.Username ?? string.Empty,
                request.Password ?? string.Empty);

            var roleName = await _userService.GetRoleNameAsync(user.RoleId);
            var token = _authService.GenerateToken(user.Id, user.Username ?? string.Empty, roleName);

            return new LoginResponseDto(
                token,
                user.Id,
                user.Username,
                user.DisplayName,
                roleName,
                user.DepartmentId);
        }

        public async Task<MyPermissionsDto> GetMyPermissionsAsync(int userId)
        {
            var authData = await (from u in _userRepo.Query(asNoTracking: true)
                                  join r in _roleRepo.Query(asNoTracking: true) on u.RoleId equals r.Id into roleGroup
                                  from role in roleGroup.DefaultIfEmpty()
                                  where u.Id == userId && !u.IsDeleted && u.IsActive
                                  select new
                                  {
                                      u.Id,
                                      u.Username,
                                      u.DisplayName,
                                      u.DepartmentId,
                                      RoleId = role != null ? (int?)role.Id : null,
                                      RoleCode = role != null ? (role.Code ?? role.Name) : string.Empty
                                  })
                                  .FirstOrDefaultAsync();

            if (authData == null)
                throw new AuthenticationException("User not found or inactive");

            string[] permissions = Array.Empty<string>();
            if (authData.RoleId.HasValue)
            {
                permissions = await (from prm in _permissionRoleMapRepo.Query(asNoTracking: true)
                                     join pi in _permissionItemRepo.Query(asNoTracking: true)
                                         on prm.PermissionItemId equals pi.Id
                                     where prm.RoleId == authData.RoleId.Value
                                     select pi.Code)
                    .ToArrayAsync();
            }

            return new MyPermissionsDto(
                authData.Id,
                authData.Username,
                authData.DisplayName,
                authData.DepartmentId,
                SystemRoles.ToCode(authData.RoleCode),
                permissions.Length > 0 ? "permission" : "role",
                permissions);
        }

        public async Task<MyProfileDto> GetMyProfileAsync(int userId)
        {
            var authData = await (from u in _userRepo.Query(asNoTracking: true)
                                  join r in _roleRepo.Query(asNoTracking: true) on u.RoleId equals r.Id into roleGroup
                                  from role in roleGroup.DefaultIfEmpty()
                                  where u.Id == userId && !u.IsDeleted && u.IsActive
                                  select new
                                  {
                                      u.Id,
                                      u.Username,
                                      u.DisplayName,
                                      u.Email,
                                      u.Position,
                                      u.EmployeeCode,
                                      u.DepartmentId,
                                      RoleId = role != null ? (int?)role.Id : null,
                                      RoleCode = role != null ? (role.Code ?? role.Name) : string.Empty
                                  })
                                  .FirstOrDefaultAsync();

            if (authData == null)
                throw new AuthenticationException("User not found or inactive");

            return new MyProfileDto(
                authData.Id,
                authData.Username,
                authData.DisplayName,
                authData.Email,
                authData.Position,
                authData.EmployeeCode,
                authData.RoleId,
                SystemRoles.ToCode(authData.RoleCode),
                authData.DepartmentId);
        }

        public async Task<MyProfileDto> UpdateMyProfileAsync(int userId, UpdateMyProfileRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.DisplayName))
                throw new ValidationException("Display name is required");

            var currentUser = await _userService.GetUserByIdAsync(userId);
            if (!currentUser.RoleId.HasValue)
                throw new ValidationException("Current user role is not configured");

            var updated = await _userService.UpdateUserAsync(
                userId,
                request.DisplayName.Trim(),
                string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                currentUser.RoleId.Value,
                currentUser.DepartmentId,
                string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim(),
                string.IsNullOrWhiteSpace(request.EmployeeCode) ? null : request.EmployeeCode.Trim());

            var roleName = await _userService.GetRoleNameAsync(updated.RoleId);
            return new MyProfileDto(
                updated.Id,
                updated.Username,
                updated.DisplayName,
                updated.Email,
                updated.Position,
                updated.EmployeeCode,
                updated.RoleId,
                roleName,
                updated.DepartmentId);
        }

        public async Task ChangeMyPasswordAsync(int userId, ChangeMyPasswordRequest request)
        {
            if (request == null
                || string.IsNullOrWhiteSpace(request.CurrentPassword)
                || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                throw new ValidationException("Current password and new password are required");
            }

            await _userService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
        }
    }
}
