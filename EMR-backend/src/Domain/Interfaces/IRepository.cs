using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Linq;
using System.Threading.Tasks;

namespace EMR.Domain.Interfaces
{
    /// <summary>
    /// Base repository interface defining common data access operations.
    /// Abstracts the underlying persistence mechanism (EF Core, Dapper, etc.)
    /// </summary>
    /// <typeparam name="T">The entity type managed by this repository</typeparam>
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// Gets an entity by its primary key.
        /// </summary>
        Task<T?> GetByIdAsync(int id);

        /// <summary>
        /// Gets all entities of type T, excluding soft-deleted ones.
        /// </summary>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Finds entities matching the specified predicate.
        /// </summary>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Gets queryable source for advanced querying (sorting, include, paging).
        /// </summary>
        IQueryable<T> Query(bool asNoTracking = true, bool includeDeleted = false);

        /// <summary>
        /// Finds the first entity matching the specified predicate.
        /// </summary>
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Adds a new entity to the repository.
        /// </summary>
        Task AddAsync(T entity);

        /// <summary>
        /// Adds multiple entities to the repository.
        /// </summary>
        Task AddRangeAsync(IEnumerable<T> entities);

        /// <summary>
        /// Updates an existing entity.
        /// </summary>
        Task UpdateAsync(T entity);

        /// <summary>
        /// Performs soft delete (marks IsDeleted = true if entity supports it).
        /// </summary>
        Task DeleteAsync(T entity);

        /// <summary>
        /// Performs soft delete by entity ID.
        /// </summary>
        Task DeleteByIdAsync(int id);

        /// <summary>
        /// Performs hard delete (physical removal from database).
        /// WARNING: Use with caution. Cannot be undone.
        /// </summary>
        Task HardDeleteAsync(T entity);

        /// <summary>
        /// Counts entities matching the predicate.
        /// </summary>
        Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

        /// <summary>
        /// Checks if any entity matches the predicate.
        /// </summary>
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);

    }
}
