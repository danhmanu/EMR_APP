using System.Threading.Tasks;
using EMR.Domain.Entities;
using EMR.Domain.Interfaces;

namespace Domain.Repositories
{
    /// <summary>
    /// Specialized repository for User entities with additional operations.
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        /// <summary>
        /// Finds a user by username (case-insensitive).
        /// </summary>
        Task<User?> GetByUsernameAsync(string username);

        /// <summary>
        /// Finds a user by email address.
        /// </summary>
        Task<User?> GetByEmailAsync(string email);

        /// <summary>
        /// Gets all users with their associated role information.
        /// </summary>
        Task<IEnumerable<User>> GetAllWithRoleAsync();
    }
}
