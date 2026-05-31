using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Domain.Repositories;
using EMR.Application.Interfaces;
using EMR.Domain.Entities;
using EMR.Domain.Exceptions;
using EMR.Domain.Interfaces;
using EMR.Domain.Security;
using Microsoft.Extensions.Logging;

namespace EMR.Application.Services
{
    /// <summary>
    /// Application service for user-related business operations.
    /// Keeps controllers thin and encapsulates domain rules.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRepository<Role> _roleRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuthService _authService;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            IRepository<Role> roleRepository,
            IUnitOfWork unitOfWork,
            IAuthService authService,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _unitOfWork = unitOfWork;
            _authService = authService;
            _logger = logger;
        }

        public async Task<User> AuthenticateAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                throw new ValidationException("Username and password are required.");

            var user = await _userRepository.GetByUsernameAsync(username);
            if (user == null || user.IsDeleted)
            {
                _logger.LogWarning("Authentication failed: user not found for username '{Username}'", username);
                throw new AuthenticationException("Invalid credentials.");
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Authentication failed: user '{Username}' is inactive", username);
                throw new AuthenticationException("User account is inactive.");
            }

            if (!_authService.VerifyPassword(password, user.PasswordHash ?? string.Empty))
            {
                _logger.LogWarning("Authentication failed: invalid password for username '{Username}'", username);
                throw new AuthenticationException("Invalid credentials.");
            }

            return user;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null || user.IsDeleted)
                throw new EntityNotFoundException(nameof(User), id);
            return user;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllAsync();
            return users.OrderBy(u => u.Username).ToList();
        }

        public async Task<User> CreateUserAsync(string username, string displayName, string? email, int roleId, string password, int? departmentId = null, string? position = null, string? employeeCode = null)
        {
            if (string.IsNullOrWhiteSpace(username))
                throw new ValidationException("Username is required.");

            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
                throw new ValidationException("Password must be at least 6 characters.");

            var exists = await _userRepository.AnyAsync(u => u.Username == username && !u.IsDeleted);
            if (exists)
                throw new DuplicateException($"Username '{username}' already exists.");

            var role = await _roleRepository.GetByIdAsync(roleId);
            if (role == null)
                throw new EntityNotFoundException(nameof(Role), roleId);

            var user = new User
            {
                Username = username,
                DisplayName = displayName,
                Position = position,
                EmployeeCode = employeeCode,
                Email = email,
                RoleId = roleId,
                DepartmentId = departmentId,
                PasswordHash = _authService.HashPassword(password),
                IsActive = true,
                IsDeleted = false
            };

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _userRepository.AddAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Created user '{Username}' with roleId {RoleId}", username, roleId);
                return user;
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<User> UpdateUserAsync(int id, string displayName, string? email, int roleId, int? departmentId = null, string? position = null, string? employeeCode = null)
        {
            var user = await GetUserByIdAsync(id);

            var role = await _roleRepository.GetByIdAsync(roleId);
            if (role == null)
                throw new EntityNotFoundException(nameof(Role), roleId);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                user.DisplayName = displayName;
                user.Position = position;
                user.EmployeeCode = employeeCode;
                user.Email = email;
                user.RoleId = roleId;
                user.DepartmentId = departmentId;
                await _userRepository.UpdateAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Updated user id {UserId}", id);
                return user;
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task DeleteUserAsync(int id)
        {
            var user = await GetUserByIdAsync(id);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _userRepository.DeleteAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Soft-deleted user id {UserId}", id);
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
                throw new ValidationException("New password must be at least 6 characters.");

            var user = await GetUserByIdAsync(userId);

            if (!_authService.VerifyPassword(currentPassword, user.PasswordHash ?? string.Empty))
                throw new AuthenticationException("Current password is invalid.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                user.PasswordHash = _authService.HashPassword(newPassword);
                await _userRepository.UpdateAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Changed password for user id {UserId}", userId);
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<bool> IsUsernameAvailableAsync(string username, int excludeUserId = 0)
        {
            if (string.IsNullOrWhiteSpace(username)) return false;
            return !await _userRepository.AnyAsync(u =>
                u.Username == username &&
                !u.IsDeleted &&
                (excludeUserId <= 0 || u.Id != excludeUserId));
        }

        public async Task<User> ToggleActiveAsync(int id)
        {
            var user = await GetUserByIdAsync(id);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                user.IsActive = !user.IsActive;
                await _userRepository.UpdateAsync(user);
                await _unitOfWork.CommitTransactionAsync();
                _logger.LogInformation("Toggled active status for user id {UserId} to {IsActive}", id, user.IsActive);
                return user;
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<string> GetRoleNameAsync(int? roleId)
        {
            if (!roleId.HasValue) return string.Empty;
            var role = await _roleRepository.GetByIdAsync(roleId.Value);
            return SystemRoles.ToCode(role?.Code ?? role?.Name);
        }

        public async Task<Dictionary<int, string>> GetRoleNamesAsync()
        {
            var roles = await _roleRepository.GetAllAsync();
            return roles.ToDictionary(r => r.Id, r => SystemRoles.ToCode(r.Code ?? r.Name));
        }
    }
}
