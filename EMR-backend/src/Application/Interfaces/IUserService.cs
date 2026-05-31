using System.Collections.Generic;
using System.Threading.Tasks;
using EMR.Domain.Entities;

namespace EMR.Application.Interfaces
{
    /// <summary>
    /// Service for managing users in the application.
    /// Handles business logic around user creation, authentication, and management.
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Authenticates a user by username and password.
        /// Returns the user if credentials are valid, null otherwise.
        /// </summary>
        Task<User> AuthenticateAsync(string username, string password);

        /// <summary>
        /// Gets a user by ID.
        /// </summary>
        Task<User> GetUserByIdAsync(int id);

        /// <summary>
        /// Gets all active users.
        /// </summary>
        Task<IEnumerable<User>> GetAllUsersAsync();

        /// <summary>
        /// Creates a new user with hashed password.
        /// </summary>
        Task<User> CreateUserAsync(string username, string displayName, string? email, int roleId, string password, int? departmentId = null, string? position = null, string? employeeCode = null);

        /// <summary>
        /// Updates user information.
        /// </summary>
        Task<User> UpdateUserAsync(int id, string displayName, string? email, int roleId, int? departmentId = null, string? position = null, string? employeeCode = null);

        /// <summary>
        /// Deletes a user (soft delete).
        /// </summary>
        Task DeleteUserAsync(int id);

        /// <summary>
        /// Changes a user's password.
        /// </summary>
        Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);

        /// <summary>
        /// Checks if username is available.
        /// </summary>
        Task<bool> IsUsernameAvailableAsync(string username, int excludeUserId = 0);

        /// <summary>
        /// Toggles user active status.
        /// </summary>
        Task<User> ToggleActiveAsync(int id);

        /// <summary>
        /// Gets role name by role id.
        /// </summary>
        Task<string> GetRoleNameAsync(int? roleId);

        /// <summary>
        /// Gets all role names keyed by role id.
        /// </summary>
        Task<Dictionary<int, string>> GetRoleNamesAsync();
    }
}
