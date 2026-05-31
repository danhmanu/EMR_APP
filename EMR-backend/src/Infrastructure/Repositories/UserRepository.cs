using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EMR.Domain.Entities;
using Domain.Repositories;

namespace EMR.Infrastructure.Repositories
{
    /// <summary>
    /// User repository with specialized queries for user domain operations.
    /// </summary>
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return null;

            return await DbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username != null && u.Username.ToLower() == username.ToLower() && !u.IsDeleted);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            return await DbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email.ToLower() && !u.IsDeleted);
        }

        public async Task<IEnumerable<User>> GetAllWithRoleAsync()
        {
            return await DbSet
                .AsNoTracking()
                .Where(u => !u.IsDeleted)
                .ToListAsync();
        }
    }
}
