using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using EMR.Domain.Interfaces;
using EMR.Domain.Entities;

namespace EMR.Infrastructure.Repositories
{
    /// <summary>
    /// Generic repository implementation using Entity Framework Core.
    /// Supports soft deletes for entities with IsDeleted property.
    /// </summary>
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly AppDbContext DbContext;
        protected readonly DbSet<T> DbSet;

        public Repository(AppDbContext dbContext)
        {
            DbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            DbSet = dbContext.Set<T>();
        }

        public virtual async Task<T?> GetByIdAsync(int id)
        {
            return await DbSet.FindAsync(id);
        }

        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await ApplySoftDeleteFilter(DbSet).ToListAsync();
        }

        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await ApplySoftDeleteFilter(DbSet).Where(predicate).ToListAsync();
        }

        public virtual IQueryable<T> Query(bool asNoTracking = true, bool includeDeleted = false)
        {
            IQueryable<T> query = DbSet;
            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return includeDeleted ? query : ApplySoftDeleteFilter(query);
        }

        public virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
            return await ApplySoftDeleteFilter(DbSet).FirstOrDefaultAsync(predicate);
        }

        public virtual async Task AddAsync(T entity)
        {
            await DbSet.AddAsync(entity);
        }

        public virtual async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await DbSet.AddRangeAsync(entities);
        }

        public virtual async Task UpdateAsync(T entity)
        {
            DbSet.Update(entity);
            await Task.CompletedTask;
        }

        public virtual async Task DeleteAsync(T entity)
        {
            // Soft delete: mark IsDeleted = true if entity supports it
            var isDeletedProperty = entity.GetType().GetProperty("IsDeleted");
            if (isDeletedProperty != null && isDeletedProperty.PropertyType == typeof(bool))
            {
                isDeletedProperty.SetValue(entity, true);
                DbSet.Update(entity);
            }
            else
            {
                // If entity doesn't support soft delete, remove it
                DbSet.Remove(entity);
            }
            await Task.CompletedTask;
        }

        public virtual async Task DeleteByIdAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                await DeleteAsync(entity);
            }
        }

        public virtual async Task HardDeleteAsync(T entity)
        {
            DbSet.Remove(entity);
            await Task.CompletedTask;
        }

        public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
        {
            var query = ApplySoftDeleteFilter(DbSet);
            if (predicate != null)
                query = query.Where(predicate);
            return await query.CountAsync();
        }

        public virtual async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
        {
            return await ApplySoftDeleteFilter(DbSet).AnyAsync(predicate);
        }

        /// <summary>
        /// Applies soft delete filter to exclude deleted entities.
        /// Only applies filter if entity has IsDeleted property.
        /// </summary>
        protected IQueryable<T> ApplySoftDeleteFilter(IQueryable<T> query)
        {
            // Check if T has IsDeleted property
            var isDeletedProperty = typeof(T).GetProperty("IsDeleted");
            if (isDeletedProperty == null || isDeletedProperty.PropertyType != typeof(bool))
                return query;

            // Build expression: x => !x.IsDeleted
            var parameter = Expression.Parameter(typeof(T), "x");
            var propertyAccess = Expression.Property(parameter, "IsDeleted");
            var notExpression = Expression.Not(propertyAccess);
            var lambda = Expression.Lambda<Func<T, bool>>(notExpression, parameter);

            return query.Where(lambda);
        }
    }
}
